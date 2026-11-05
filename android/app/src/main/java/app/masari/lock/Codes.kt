package app.masari.lock

import android.content.Context
import java.nio.ByteBuffer
import java.security.SecureRandom
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object Codes {
    private const val B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

    fun randomSecret(): String {
        val b = ByteArray(20); SecureRandom().nextBytes(b)
        val bits = StringBuilder()
        for (x in b) bits.append(Integer.toBinaryString((x.toInt() and 0xff) + 0x100).substring(1))
        val out = StringBuilder(); var i = 0
        while (i + 5 <= bits.length) { out.append(B32[bits.substring(i, i + 5).toInt(2)]); i += 5 }
        return out.toString()
    }

    fun b32dec(s: String): ByteArray {
        val bits = StringBuilder()
        for (ch in s.uppercase()) { val v = B32.indexOf(ch); if (v >= 0) bits.append(Integer.toBinaryString(v + 32).substring(1)) }
        val out = ArrayList<Byte>(); var i = 0
        while (i + 8 <= bits.length) { out.add(bits.substring(i, i + 8).toInt(2).toByte()); i += 8 }
        return out.toByteArray()
    }

    private fun hmac(alg: String, key: ByteArray, msg: ByteArray): ByteArray {
        val m = Mac.getInstance(alg); m.init(SecretKeySpec(key, alg)); return m.doFinal(msg)
    }

    /** نفس صيغة تطبيق الويب: HMAC-SHA256(secret, "masari:YYYY-MM-DD") أول 31 بت mod 1e6 */
    fun dailyCode(secret: String, date: String): String {
        val s = hmac("HmacSHA256", b32dec(secret), ("masari:$date").toByteArray())
        val n = ((s[0].toInt() and 0x7f) shl 24) or ((s[1].toInt() and 0xff) shl 16) or ((s[2].toInt() and 0xff) shl 8) or (s[3].toInt() and 0xff)
        return (n % 1000000).toString().padStart(6, '0')
    }

    /** TOTP قياسي (RFC 6238) متوافق مع Google Authenticator */
    fun totp(secret: String, step: Long): String {
        val h = hmac("HmacSHA1", b32dec(secret), ByteBuffer.allocate(8).putLong(step).array())
        val o = h[h.size - 1].toInt() and 0xf
        val n = ((h[o].toInt() and 0x7f) shl 24) or ((h[o + 1].toInt() and 0xff) shl 16) or ((h[o + 2].toInt() and 0xff) shl 8) or (h[o + 3].toInt() and 0xff)
        return (n % 1000000).toString().padStart(6, '0')
    }

    fun verify(c: Context, input: String): Boolean {
        val sec = Store.secret(c); if (sec.isEmpty()) return false
        val code = input.trim()
        return if (Store.mode(c) == "partner") {
            val now = System.currentTimeMillis() / 30000L
            (-3L..3L).any { totp(sec, now + it) == code }
        } else dailyCode(sec, Store.today()) == code
    }
}
