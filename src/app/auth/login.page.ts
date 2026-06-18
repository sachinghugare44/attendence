import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  authMode: 'password-login' | 'otp-login' | 'register' = 'password-login';
  loginForm: FormGroup;
  otpLoginForm: FormGroup;
  registerForm: FormGroup;
  registerOtpForm: FormGroup;
  
  loginError: string = '';
  registerError: string = '';
  successMessage: string = '';
  isLoginLoading: boolean = false;
  isRegisterLoading: boolean = false;
  
  // OTP States
  otpSent: boolean = false;
  otpVerified: boolean = false;
  isLoadingOtp: boolean = false;
  
  // Register OTP States
  registerOtpSent: boolean = false;
  registerEmailVerified: boolean = false;
  isLoadingRegisterOtp: boolean = false;
  registerMobileNumber: string = '';
  showerror: boolean = false;
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: Router,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.otpLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      otpCode: ['']
    });
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(9)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(9)]]
    });
    this.registerOtpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otpCode: ['']
    });
  }

  onAuthModeChange(event: any) {
    const value = event.detail.value;
    if (value === 'password-login' || value === 'otp-login' || value === 'register') {
      this.setAuthMode(value);
    }
  }

  setAuthMode(mode: 'password-login' | 'otp-login' | 'register') {
    this.authMode = mode;
    this.loginError = '';
    this.registerError = '';
    this.successMessage = '';
    this.isLoginLoading = false;
    this.isRegisterLoading = false;
    this.otpSent = false;
    this.otpVerified = false;
    this.registerOtpSent = false;
    this.registerEmailVerified = false;
  }

  onLogin() {
    this.loginError = '';
    this.successMessage = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const requestBody = {
      mobile: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.isLoginLoading = true;
    this.apiService.validateUser(requestBody).subscribe({
      next: response => {
        this.isLoginLoading = false;
        const responseData: any = response;
        this.presentToast('Login successful!', 'success');
        localStorage.setItem('mobile', requestBody.mobile);
        localStorage.setItem('name', requestBody.password);
        localStorage.setItem('userId', responseData?.data.name);
        localStorage.setItem('usertype', responseData.data.usertype);
        // clear login form on success
        this.loginForm.reset();
        if(responseData?.data.usertype === '2'){
          this.route.navigate(['/admin-dashboard']);
        } else {
          this.route.navigate(['/member-dashboard']);
        }
      },
      error: error => {
        this.isLoginLoading = false;
        this.loginError = error?.error?.message || 'Invalid credentials. Please try again.';
        this.presentToast(this.loginError, 'danger');
        // clear only the password on error for security
        try { this.loginForm.patchValue({ password: '' }); } catch(e) {}
      },
    });
  }

  // OTP Login - Send OTP
  sendOtpForLogin() {
    this.loginError = '';
    const email = this.otpLoginForm.get('email')?.value;
    const mobile = this.otpLoginForm.get('mobile')?.value;
    
    if (!email || !mobile) {
      this.loginError = 'Please enter email and mobile number';
      return;
    }

    this.isLoadingOtp = true;
    const requestBody = { email, mobile };

    this.apiService.sendOtp(requestBody).subscribe({
      next: () => {
        this.otpSent = true;
        this.isLoadingOtp = false;
        this.successMessage = 'OTP sent to your email!';
        this.presentToast('OTP sent successfully!', 'success');
      },
      error: error => {
        this.isLoadingOtp = false;
        this.loginError = error?.error?.message || 'Failed to send OTP';
        this.presentToast(this.loginError, 'danger');
      }
        // clear otp form on success
        // try { this.otpLoginForm.reset(); }
    });
  }

  // OTP Login - Verify OTP
  verifyOtpForLogin() {
    this.loginError = '';
    const email = this.otpLoginForm.get('email')?.value;
    const otpCode = this.otpLoginForm.get('otpCode')?.value;

    if (!otpCode) {
        // clear only otp code on error
        try { this.otpLoginForm.patchValue({ otpCode: '' }); } catch(e) {}
      this.loginError = 'Please enter OTP code';
      return;
    }

    this.isLoadingOtp = true;
    const requestBody = { email, otpCode };

    this.apiService.verifyOtp(requestBody).subscribe({
      next: (response: any) => {
        this.isLoadingOtp = false;
        this.otpVerified = true;
        this.successMessage = 'OTP verified successfully!';
        this.presentToast('Login successful!', 'success');
        
        // Store user details and navigate
        localStorage.setItem('mobile', this.otpLoginForm.get('mobile')?.value);
        localStorage.setItem('email', email);
        localStorage.setItem('userId', response?.data?.id);
        localStorage.setItem('usertype', response?.data?.usertype || '1');
        
        // setTimeout(() => {
          if (response?.data?.usertype === '2') {
            this.route.navigate(['/admin-dashboard']);
          } else {
            this.route.navigate(['/member-dashboard']);
          }
        // }, 1500);
      },
      error: error => {
        this.isLoadingOtp = false;
        this.loginError = error?.error?.message || 'Invalid OTP';
        this.presentToast(this.loginError, 'danger');
      }
    });
  }

  // Register - Send OTP for Email Verification
  sendOtpForRegister() {
    this.registerError = '';
    const email = this.registerOtpForm.get('email')?.value;
    const mobile = this.registerForm.get('mobile')?.value;
    this.registerMobileNumber = mobile || '';
    if (!email) {
      this.registerError = 'Please enter email';
      return;
    }

    this.isLoadingRegisterOtp = true;
    const requestBody = { email, mobile }; // Placeholder mobile during email verification

    this.apiService.sendOtp(requestBody).subscribe({
      next: () => {
        this.registerOtpSent = true;
        this.isLoadingRegisterOtp = false;
        this.successMessage = 'OTP sent to your email!';
        this.presentToast('OTP sent successfully!', 'success');
      },
      error: error => {
        this.isLoadingRegisterOtp = false;
        this.registerError = error?.error?.message || 'Failed to send OTP';
        this.presentToast(this.registerError, 'danger');
      }
    });
  }

  // Register - Verify Email OTP
  verifyEmailOtp() {
    this.registerError = '';
    const email = this.registerOtpForm.get('email')?.value;
    const otpCode = this.registerOtpForm.get('otpCode')?.value;

    if (!otpCode) {
      this.registerError = 'Please enter OTP code';
      return;
    }

    this.isLoadingRegisterOtp = true;
    const requestBody = { email, otpCode };

    this.apiService.verifyOtp(requestBody).subscribe({
      next: () => {
        this.isLoadingRegisterOtp = false;
        // this.registerEmailVerified = true;
        this.successMessage = 'Email verified! Now complete your registration.';
        this.presentToast('Email verified!', 'success');
        
        // Pre-fill email in register form
        this.registerForm.patchValue({ email });
      },
      error: error => {
        this.isLoadingRegisterOtp = false;
        this.registerError = error?.error?.message || 'Invalid OTP';
        this.presentToast(this.registerError, 'danger');
      }
    });
  }

  onRegister() {
    this.registerError = '';
    this.successMessage = '';
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
   const usertypevalue = Math.floor(1000 + Math.random() * 9000).toString();
    const requestBody = {
      email: this.registerForm.value.email,
      name: this.registerForm.value.name,
      password: this.registerForm.value.password,
      mobile: this.registerForm.value.mobile,
      usertype: usertypevalue
    };
    // Only allow register if email is verified
    // if (!this.registerEmailVerified) {
    //   this.registerError = 'Please verify your email first';
    //   this.presentToast(this.registerError, 'success');
    //   return;
    // }

    this.isRegisterLoading = true;
    this.apiService.createUser(requestBody).subscribe({
      next: () => {
        this.isRegisterLoading = false;
        this.successMessage = 'Registration successful! You can now login.';
        this.presentToast('Registration successful! You can now login.', 'success');
        this.registerForm.reset();
        setTimeout(() => {
          this.successMessage = '';
          // this.toggleMode();
        }, 1200);
      },
      error: error => {
        this.isRegisterLoading = false;
        if (error?.error?.message && error.error.message.toLowerCase().includes('already')) {
          this.registerError = 'User already exists with these details.';
        } else {
          this.registerError = 'Registration failed. Please try again.';
        }
        this.presentToast(this.registerError, 'danger');
        this.registerForm.reset();
      },
    });
  }
  onClickHome() {
    this.route.navigate(['/home']);
  }

  onclickresult(){
    this.route.navigate([('/results')])
  }

  callPhoneNumber(phoneNumber:number) {
    window.location.href = `tel:${phoneNumber}`;
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color,
      cssClass: 'auth-toast',
      buttons: [{ text: 'Close', role: 'cancel' }]
    });

    await toast.present();
  }

  onConfirmPasswordChange() {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.registerForm.get('confirmPassword')?.setErrors({ mismatch: true });
      this.showerror = true;
    } else {
      this.registerForm.get('confirmPassword')?.setErrors(null);
      this.showerror = false;
    }
  }
}
