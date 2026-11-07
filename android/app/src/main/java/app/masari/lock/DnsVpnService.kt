package app.masari.lock

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.Executors

/** VPN local qui ne capte que le DNS: bloque les domaines choisis tant que le hifz du jour n'est pas validé,
 *  et filtre le contenu adulte en permanence (DNS amont 1.1.1.3). Aucun trafic n'est lu ni enregistré. */
class DnsVpnService : VpnService() {
    companion object {
        @Volatile var running = false
        const val FAKE_DNS = "10.99.0.2"
        const val UPSTREAM = "1.1.1.3"
    }
    private var tun: ParcelFileDescriptor? = null
    private var thread: Thread? = null
    private val pool = Executors.newFixedThreadPool(6)

    override fun onStartCommand(i: Intent?, f: Int, s: Int): Int {
        if (running) return START_STICKY
        val b = Builder().setSession("Masari").addAddress("10.99.0.1", 32).addDnsServer(FAKE_DNS)
            .addRoute(FAKE_DNS, 32).setBlocking(true)
        tun = try { b.establish() } catch (e: Exception) { null }
        if (tun == null) { stopSelf(); return START_NOT_STICKY }
        running = true
        val t = tun!!
        val input = FileInputStream(t.fileDescriptor); val output = FileOutputStream(t.fileDescriptor)
        thread = Thread {
            val buf = ByteArray(32767)
            try {
                while (running) {
                    val n = input.read(buf); if (n <= 0) continue
                    val pkt = buf.copyOf(n)
                    pool.execute { try { handle(pkt, output) } catch (e: Exception) { } }
                }
            } catch (e: Exception) { }
            running = false
        }.also { it.start() }
        return START_STICKY
    }

    private fun handle(p: ByteArray, out: FileOutputStream) {
        if (p.size < 28 || (p[0].toInt() shr 4) != 4 || p[9].toInt() != 17) return
        val ihl = (p[0].toInt() and 0x0F) * 4
        val dport = ((p[ihl + 2].toInt() and 0xFF) shl 8) or (p[ihl + 3].toInt() and 0xFF)
        if (dport != 53) return
        val q = p.copyOfRange(ihl + 8, p.size)
        val name = qname(q) ?: return
        val reply: ByteArray = if (isBlocked(name)) nx(q) else forward(q) ?: return
        val total = 20 + 8 + reply.size; val r = ByteArray(total)
        r[0] = 0x45.toByte(); r[2] = (total shr 8).toByte(); r[3] = total.toByte(); r[6] = 0x40; r[8] = 64; r[9] = 17
        System.arraycopy(p, 16, r, 12, 4); System.arraycopy(p, 12, r, 16, 4)
        var sum = 0; for (k in 0 until 20 step 2) sum += ((r[k].toInt() and 0xFF) shl 8) or (r[k + 1].toInt() and 0xFF)
        while (sum shr 16 != 0) sum = (sum and 0xFFFF) + (sum shr 16)
        val c = sum.inv() and 0xFFFF; r[10] = (c shr 8).toByte(); r[11] = c.toByte()
        r[20] = 0; r[21] = 53; r[22] = p[ihl]; r[23] = p[ihl + 1]
        val ul = 8 + reply.size; r[24] = (ul shr 8).toByte(); r[25] = ul.toByte()
        System.arraycopy(reply, 0, r, 28, reply.size)
        synchronized(out) { out.write(r) }
    }

    private fun qname(q: ByteArray): String? {
        if (q.size < 17) return null
        var i = 12; val sb = StringBuilder()
        while (i < q.size && q[i].toInt() != 0) { val l = q[i].toInt() and 0xFF; if (l > 63 || i + 1 + l > q.size) return null
            if (sb.isNotEmpty()) sb.append('.'); sb.append(String(q, i + 1, l, Charsets.US_ASCII)); i += 1 + l }
        return sb.toString().lowercase()
    }

    private fun nx(q: ByteArray): ByteArray {
        var i = 12; while (i < q.size && q[i].toInt() != 0) i += (q[i].toInt() and 0xFF) + 1
        val end = minOf(q.size, i + 5); val r = q.copyOf(end)
        r[2] = 0x81.toByte(); r[3] = 0x83.toByte(); for (k in 6..11) r[k] = 0
        return r
    }

    private fun isBlocked(name: String): Boolean {
        if (Store.unlocked(this) || !Store.webBlock(this)) return false
        return Store.domains(this).any { name == it || name.endsWith(".$it") }
    }

    private fun forward(q: ByteArray): ByteArray? {
        val s = DatagramSocket(); return try {
            protect(s); s.soTimeout = 4000
            s.send(DatagramPacket(q, q.size, InetAddress.getByName(UPSTREAM), 53))
            val b = ByteArray(4096); val d = DatagramPacket(b, b.size); s.receive(d); b.copyOf(d.length)
        } catch (e: Exception) { null } finally { s.close() }
    }

    override fun onDestroy() { running = false; try { tun?.close() } catch (e: Exception) { }; pool.shutdownNow(); super.onDestroy() }
    override fun onRevoke() { running = false; super.onRevoke() }
}
