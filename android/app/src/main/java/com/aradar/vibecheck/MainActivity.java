package com.aradar.vibecheck;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("open_entry_form", false)) {
            // Store flag in SharedPreferences so the app can pick it up on start
            // Capacitor Preferences uses "CapacitorStorage" SharedPreferences
            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            prefs.edit().putString("widget_openEntryForm", "true").apply();

            // Also try to trigger the event directly if the bridge is ready
            if (bridge != null) {
                bridge.triggerWindowJSEvent("widget-event", "{ \"openEntryForm\": true }");
            }
        }
    }
}
