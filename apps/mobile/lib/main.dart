import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/telegram_service.dart';
import 'services/transfer_service.dart';
import 'screens/login_screen.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final telegramService = TelegramMobileService.instance;
  final transferService = TransferMobileService.instance;

  await telegramService.init();
  await transferService.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: telegramService),
        ChangeNotifierProvider.value(value: transferService),
      ],
      child: const TGCloudApp(),
    ),
  );
}

class TGCloudApp extends StatelessWidget {
  const TGCloudApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final tg = context.watch<TelegramMobileService>();

    return MaterialApp(
      title: 'TGCloud',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F141C),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2481CC),
          surface: Color(0xFF171E28),
        ),
        fontFamily: 'Roboto',
      ),
      home: tg.authStep == MobileAuthStep.authenticated
          ? const MainNavigationScreen()
          : const MobileLoginScreen(),
    );
  }
}
