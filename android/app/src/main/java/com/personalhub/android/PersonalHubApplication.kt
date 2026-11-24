package com.personalhub.android

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class PersonalHubApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
