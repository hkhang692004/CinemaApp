import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../providers/auth_provider.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final emailController = TextEditingController();
  final newPasswordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  String otp = "";
  bool otpSent = false;
  bool isObscureNew = true;
  bool isObscureConfirm = true;
  String? message;

  final formKey = GlobalKey<FormState>();

  void showSnackbar(String msg, [Color? color]) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: color ?? Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final backgroundColor = const Color(0xFFFFFFFF);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: backgroundColor,
        elevation: 0,
        leading: BackButton(color: Colors.black),
        title: Text(
          otpSent ? "Đặt lại mật khẩu" : "Quên Mật Khẩu",
          style: TextStyle(
            fontWeight: FontWeight.bold, color: Colors.black, fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 22.0),
        child: Center(
          child: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (!otpSent) ...[
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: const BoxDecoration(
                        color: Color(0xFFE53935), // Đỏ
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.movie,
                        size: 50,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Absolute',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Cinema',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.red[700],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Text(
                      "Vui lòng nhập email đã đăng ký của bạn để nhận mã OTP đặt lại mật khẩu.",
                      style: TextStyle(color: Colors.black, fontSize: 15),
                    ),
                    SizedBox(height: 30),
                    Text("Email", style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600)),
                    SizedBox(height: 8),
                    TextFormField(
                      controller: emailController,
                      style: TextStyle(color: Colors.white),
                      validator: (value) {
                        if (value == null || value.isEmpty) return "Vui lòng nhập email";
                        if (!value.contains("@") || !value.contains(".")) return "Email không hợp lệ";
                        return null;
                      },
                      decoration: InputDecoration(
                        hintText: "Nhập email của bạn",
                        hintStyle: TextStyle(color: Colors.black45),
                        filled: true,
                        fillColor: Color(0xFFF3F4F6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                        contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      ),
                    ),
                    SizedBox(height: 40),
                    ElevatedButton(
                      onPressed: authProvider.isLoading
                          ? null
                          : () async {
                        if (!formKey.currentState!.validate()) return;
                        final success = await authProvider.sendOTP(emailController.text.trim());
                        setState(() {
                          otpSent = success;
                          message = authProvider.errorMessage ??
                              (success ? "OTP đã gửi đến email của bạn!" : "Không gửi được OTP. Kiểm tra lại email.");
                        });
                        if (otpSent) {
                          showSnackbar("Hãy kiểm tra email để lấy mã OTP!", Colors.green);
                        } else if (message != null) {
                          showSnackbar(message!);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFFE53935),
                          padding: EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      child: authProvider.isLoading
                          ? CircularProgressIndicator(color: Colors.white)
                          : Text("Gửi OTP", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold,color: Colors.white)),
                    ),
                    SizedBox(height: 20),
                  ] else ...[
                    Center(
                      child: Column(
                        children: [
                          Text("Absolute Cinema", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                          SizedBox(height: 6),
                          Text(
                            "Vui lòng nhập mã OTP đã được gửi đến bạn và tạo mật khẩu mới.",
                            style: TextStyle(color: Colors.white, fontSize: 15),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: 24),
                        ],
                      ),
                    ),
                    Text("Mã OTP", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 10),
                    PinCodeTextField(
                      length: 6,
                      appContext: context,
                      keyboardType: TextInputType.number,
                      obscureText: false,
                      animationType: AnimationType.fade,
                      onChanged: (value) {
                        setState(() => otp = value);
                      },
                      pinTheme: PinTheme(
                        shape: PinCodeFieldShape.box,
                        borderRadius: BorderRadius.circular(8),
                        fieldHeight: 44,
                        fieldWidth: 40,
                        inactiveColor: Colors.white30,
                        activeColor: Color(0xFFE53935),
                        selectedColor: Colors.red,
                        inactiveFillColor: Colors.black45,
                        activeFillColor: Colors.black45,
                        selectedFillColor: Colors.black,
                      ),
                      enableActiveFill: true,
                      textStyle: TextStyle(color: Colors.white, fontSize: 20),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: authProvider.isLoading
                            ? null
                            : () async {
                          await authProvider.sendOTP(emailController.text.trim());
                          showSnackbar("OTP đã được gửi lại!", Colors.green);
                        },
                        child: Text("Gửi lại OTP", style: TextStyle(color: Color(0xFFE53935), decoration: TextDecoration.underline)),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text("Mật khẩu mới", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    TextFormField(
                      controller: newPasswordController,
                      obscureText: isObscureNew,
                      style: TextStyle(color: Colors.white),
                      validator: (value) {
                        if (value == null || value.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
                        // Có thể thêm validate mạnh tùy nhu cầu
                        return null;
                      },
                      decoration: InputDecoration(
                        hintText: "Nhập mật khẩu mới của bạn",
                        hintStyle: TextStyle(color: Colors.white38),
                        filled: true,
                        fillColor: Colors.black45,
                        suffixIcon: IconButton(
                          icon: Icon(isObscureNew ? Icons.visibility_off : Icons.visibility, color: Colors.white54),
                          onPressed: () => setState(() => isObscureNew = !isObscureNew),
                        ),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                        contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      ),
                    ),
                    SizedBox(height: 10),
                    Text("Xác nhận mật khẩu mới", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    TextFormField(
                      controller: confirmPasswordController,
                      obscureText: isObscureConfirm,
                      style: TextStyle(color: Colors.white),
                      validator: (value) {
                        if (value != newPasswordController.text) return "Hai mật khẩu không khớp!";
                        return null;
                      },
                      decoration: InputDecoration(
                        hintText: "Xác nhận lại mật khẩu mới",
                        hintStyle: TextStyle(color: Colors.white38),
                        filled: true,
                        fillColor: Colors.black45,
                        suffixIcon: IconButton(
                          icon: Icon(isObscureConfirm ? Icons.visibility_off : Icons.visibility, color: Colors.white54),
                          onPressed: () => setState(() => isObscureConfirm = !isObscureConfirm),
                        ),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                        contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      ),
                    ),
                    SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: authProvider.isLoading
                          ? null
                          : () async {
                        if (otp.length != 6) {
                          showSnackbar("OTP phải gồm 6 số");
                          return;
                        }
                        if (!formKey.currentState!.validate()) return;
                        final success = await authProvider.resetPassword(
                          emailController.text.trim(),
                          newPasswordController.text,
                          otp,
                        );
                        if (success) {
                          showSnackbar("Đặt lại mật khẩu thành công. Hãy đăng nhập lại!", Colors.green);
                          Navigator.pop(context); // hoặc chuyển về màn login tuỳ luồng app
                        } else {
                          showSnackbar(authProvider.errorMessage ?? "Đặt lại mật khẩu thất bại!");
                        }
                      },
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFFE53935),
                          padding: EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      child: authProvider.isLoading
                          ? CircularProgressIndicator(color: Colors.white)
                          : Text("Đặt lại mật khẩu", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}