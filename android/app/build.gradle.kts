plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "app.masari.lock"
    compileSdk = 34
    defaultConfig {
        applicationId = "app.masari.lock"
        minSdk = 26
        targetSdk = 34
        versionCode = 3
        versionName = "2.0"
    }
    signingConfigs {
        getByName("debug") {
            storeFile = file("masari.jks"); storePassword = "masari123"
            keyAlias = "masari"; keyPassword = "masari123"
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
