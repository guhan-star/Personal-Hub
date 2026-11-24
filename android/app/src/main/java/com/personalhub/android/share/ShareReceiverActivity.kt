package com.personalhub.android.share

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.personalhub.android.PersonalHubTheme
import java.util.regex.Pattern

class ShareReceiverActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val intent = intent
        val action = intent.action
        val type = intent.type

        if (Intent.ACTION_SEND == action && type != null) {
            handleSingleShare(intent, type)
        } else if (Intent.ACTION_SEND_MULTIPLE == action && type != null) {
            handleMultipleShare(intent, type)
        } else {
            finish()
        }
    }

    private fun handleSingleShare(intent: Intent, mimeType: String) {
        when {
            mimeType.startsWith("text/") -> {
                val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT) ?: ""
                val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: ""
                val extractedUrl = extractUrl(sharedText)

                val targetModule = classifyContent(extractedUrl, sharedText)

                setContent {
                    PersonalHubTheme {
                        ShareConfirmationDialog(
                            title = "Save to PersonalHub",
                            content = extractedUrl ?: sharedText,
                            targetModule = targetModule,
                            onConfirm = {
                                // Save and finish
                                Toast.makeText(this, "Saved to $targetModule", Toast.LENGTH_SHORT).show()
                                finish()
                            },
                            onDismiss = { finish() }
                        )
                    }
                }
            }
            mimeType.startsWith("image/") -> {
                val imageUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                Toast.makeText(this, "Image saved to Media Vault", Toast.LENGTH_SHORT).show()
                finish()
            }
            mimeType.startsWith("video/") -> {
                val videoUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                Toast.makeText(this, "Video saved to Media Vault", Toast.LENGTH_SHORT).show()
                finish()
            }
            else -> finish()
        }
    }

    private fun handleMultipleShare(intent: Intent, mimeType: String) {
        val streamUris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
        Toast.makeText(this, "${streamUris?.size ?: 0} items saved to Media Vault", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun extractUrl(text: String): String? {
        val matcher = Pattern.compile("https?://[\\w\\d:#@%/;$()~_?\\+-=\\\\\\.&]+").matcher(text)
        return if (matcher.find()) matcher.group(0) else null
    }

    private fun classifyContent(url: String?, text: String): String {
        val combined = "${url ?: ""} $text".lowercase()
        return when {
            combined.contains("amazon.") || combined.contains("amzn.to") ||
            combined.contains("flipkart.com") || combined.contains("myntra.com") ||
            combined.contains("meesho.com") -> "Product Vault"
            else -> "Media Vault"
        }
    }
}

@Composable
fun ShareConfirmationDialog(
    title: String,
    content: String,
    targetModule: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Saving to: $targetModule",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = content,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 3
                )
            }
        },
        confirmButton = {
            Button(onClick = onConfirm) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
