import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/telegram_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final tg = context.watch<TelegramMobileService>();
    final user = tg.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFF0F141C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F141C),
        elevation: 0,
        title: const Text(
          'Settings',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Account Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF171E28),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF263345)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: const Color(0xFF2481CC).withOpacity(0.2),
                  child: Text(
                    user?.firstName.isNotEmpty == true ? user!.firstName[0].toUpperCase() : 'U',
                    style: const TextStyle(color: Color(0xFF2481CC), fontWeight: FontWeight.bold, fontSize: 20),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${user?.firstName ?? ''} ${user?.lastName ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user?.username != null ? '@${user!.username}' : user?.phone ?? 'Telegram Account',
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Settings Section: Transfers
          const Text('Transfers', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          _SettingTile(
            icon: Icons.speed,
            title: 'Concurrent Transfers',
            subtitle: '3 simultaneous streams',
            onTap: () {},
          ),
          _SettingTile(
            icon: Icons.sync,
            title: 'Auto Retry',
            subtitle: 'Automatically retry interrupted transfers',
            onTap: () {},
          ),

          const SizedBox(height: 20),

          // Security & Storage
          const Text('Storage & Security', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          _SettingTile(
            icon: Icons.lock_outline,
            title: 'App Lock & Biometrics',
            subtitle: 'Require biometric authentication',
            onTap: () {},
          ),
          _SettingTile(
            icon: Icons.cloud_done_outlined,
            title: 'Telegram Storage Vault',
            subtitle: 'Dedicated private channel vault',
            onTap: () {},
          ),

          const SizedBox(height: 32),

          // Logout
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () => tg.logout(),
              icon: const Icon(Icons.logout, color: Colors.redAccent, size: 18),
              label: const Text('Log Out', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: Colors.redAccent.withOpacity(0.3)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF171E28),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF263345)),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: const Color(0xFF2481CC), size: 22),
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFF475569), size: 20),
      ),
    );
  }
}
