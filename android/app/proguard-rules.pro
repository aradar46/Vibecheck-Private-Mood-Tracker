# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ---------------------------------------------------------------------------
# Capacitor
#
# Capacitor resolves plugins and their permission/activity callbacks through
# runtime annotation reflection. @capacitor/android ships -keep rules via
# consumerProguardFiles, but those only retain the classes and methods; they do
# NOT retain the annotations themselves. Without the attributes below, R8
# strips com.getcapacitor.annotation.* entirely and
# PluginHandle.requestPermissions()/getPermissionStates() dereference a null
# annotation, crashing with NullPointerException the first time a plugin asks
# for a runtime permission (voice notes -> RECORD_AUDIO, reminders ->
# POST_NOTIFICATIONS).
-keepattributes *Annotation*, RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations, AnnotationDefault

# Keep the annotation types themselves so the retained annotations resolve.
-keep class com.getcapacitor.annotation.** { *; }

# Plugin classes and their reflectively-invoked members.
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.Permission <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }
