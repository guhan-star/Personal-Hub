package com.personalhub.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import dagger.hilt.android.AndroidEntryPoint

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object MediaVault : Screen("media_vault", "Media Vault", Icons.Default.PhotoLibrary)
    object ProductVault : Screen("product_vault", "Product Vault", Icons.Default.ShoppingBag)
    object SpendWise : Screen("spendwise", "SpendWise", Icons.Default.AccountBalanceWallet)
}

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PersonalHubTheme {
                MainAppScaffold()
            }
        }
    }
}

@Composable
fun MainAppScaffold() {
    var selectedScreen by remember { mutableStateOf<Screen>(Screen.SpendWise) }
    val screens = listOf(Screen.MediaVault, Screen.ProductVault, Screen.SpendWise)

    Scaffold(
        bottomBar = {
            NavigationBar {
                screens.forEach { screen ->
                    NavigationBarItem(
                        selected = selectedScreen == screen,
                        onClick = { selectedScreen = screen },
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = MaterialTheme.colorScheme.background
        ) {
            when (selectedScreen) {
                Screen.MediaVault -> Text(
                    text = "Media Vault: Social media videos, posts, articles",
                    modifier = Modifier.padding(innerPadding)
                )
                Screen.ProductVault -> Text(
                    text = "Product Vault: Saved shopping items, price tracker",
                    modifier = Modifier.padding(innerPadding)
                )
                Screen.SpendWise -> Text(
                    text = "SpendWise: Income, Expenses & Double-entry Ledger",
                    modifier = Modifier.padding(innerPadding)
                )
            }
        }
    }
}

@Composable
fun PersonalHubTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = androidx.compose.ui.graphics.Color(0xFF7167E8),
            secondary = androidx.compose.ui.graphics.Color(0xFF8E83F5),
            background = androidx.compose.ui.graphics.Color(0xFFF5F6FA)
        ),
        content = content
    )
}
