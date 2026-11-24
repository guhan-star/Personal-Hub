package com.personalhub.android.detector

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class BankNotificationListenerService : NotificationListenerService() {

    private val supportedPackages = setOf(
        "com.google.android.apps.nbu.paisa.user", // Google Pay
        "com.phonepe.app",                       // PhonePe
        "net.one97.paytm",                        // Paytm
        "com.dreamplug.androidapp",               // CRED
        "com.hdfcbank.android",                   // HDFC
        "com.sbi.lotusintouch",                   // YONO SBI
        "com.csam.icici.bank.imobile"             // iMobile ICICI
    )

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName
        if (!supportedPackages.contains(packageName)) return

        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        val rawSnippet = "$title $text"
        Log.d("BankNotificationListener", "Detected bank notification: $rawSnippet")

        // Parse using on-device regex (strictly on device)
        // Stage in Room database for user verification before ledger update
    }
}
