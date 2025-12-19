import React, { useState, useEffect, useRef } from 'react';
import { Package, CheckCircle, XCircle, Clock, Send, Scan, Download, Camera, Upload, RefreshCw, Shield, Mail } from 'lucide-react';

// Encryption utilities
const encryptData = (data) => {
  const str = JSON.stringify(data);
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode('0x' + p1)
  ));
};

const decryptData = (encrypted) => {
  try {
    const decoded = atob(encrypted);
    const str = decodeURIComponent(decoded.split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

// Mock QR Code generation (visual representation)
const generateQRCode = (data) => {
  const size = 200;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Simple QR-like pattern
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000000';
  
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 0; i < 400; i++) {
    const x = ((hash * i * 7) % 18) * 10 + 20;
    const y = ((hash * i * 13) % 18) * 10 + 20;
    ctx.fillRect(x, y, 10, 10);
  }
  
  return canvas.toDataURL();
};

// Mock Email OTP service
const sendEmailOTP = (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`OTP sent to ${email}: ${otp}`);
  return otp;
};

const PostalIdentitySystem = () => {
  const [mode, setMode] = useState('dark');
  const [activeFlow, setActiveFlow] = useState('receiver');
  const [packages, setPackages] = useState({});
  
  useEffect(() => {
    const stored = localStorage.getItem('postal-packages');
    if (stored) setPackages(JSON.parse(stored));
  }, []);
  
  const savePackages = (pkgs) => {
    setPackages(pkgs);
    localStorage.setItem('postal-packages', JSON.stringify(pkgs));
  };

  return (
    <div className={`min-h-screen ${mode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <nav className={`${mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-xl">Postal Identity</span>
          </div>
          <button 
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className={`px-3 py-1 rounded-lg ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveFlow('receiver')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeFlow === 'receiver'
                ? 'bg-blue-500 text-white'
                : mode === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Scan className="w-5 h-5 inline mr-2" />
            Receive Package
          </button>
          <button
            onClick={() => setActiveFlow('sender')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeFlow === 'sender'
                ? 'bg-blue-500 text-white'
                : mode === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Send className="w-5 h-5 inline mr-2" />
            Send Package
          </button>
        </div>

        {activeFlow === 'receiver' ? (
          <ReceiverFlow mode={mode} packages={packages} savePackages={savePackages} />
        ) : (
          <SenderFlow mode={mode} packages={packages} savePackages={savePackages} />
        )}
      </div>
    </div>
  );
};

const SenderFlow = ({ mode, packages, savePackages }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: ''
  });
  const [packageData, setPackageData] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const generatePackage = () => {
    const packageId = `PKG${Date.now()}`;
    const payload = {
      sender: {
        name: formData.senderName,
        phone: formData.senderPhone,
        address: formData.senderAddress
      },
      receiver: {
        name: formData.receiverName,
        phone: formData.receiverPhone,
        address: formData.receiverAddress
      },
      packageId,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      logs: [{ timestamp: new Date().toISOString(), event: 'Package created', status: 'PENDING' }]
    };

    const encrypted = encryptData(payload);
    const qr = generateQRCode(encrypted);
    
    setPackageData({ ...payload, encrypted });
    setQrCode(qr);
    
    const newPackages = { ...packages, [packageId]: payload };
    savePackages(newPackages);
    
    setStep(3);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `${packageData.packageId}_qr.png`;
    link.href = qrCode;
    link.click();
  };

  const inputClass = `w-full px-4 py-3 rounded-lg ${
    mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
  } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  return (
    <div className={`${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= s ? 'bg-blue-500 text-white' : mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-500' : mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4">Sender Information</h2>
          <input
            type="text"
            placeholder="Your Name"
            value={formData.senderName}
            onChange={(e) => handleInputChange('senderName', e.target.value)}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Your Phone Number"
            value={formData.senderPhone}
            onChange={(e) => handleInputChange('senderPhone', e.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Your Address"
            value={formData.senderAddress}
            onChange={(e) => handleInputChange('senderAddress', e.target.value)}
            className={`${inputClass} h-24 resize-none`}
          />
          <button
            onClick={() => setStep(2)}
            disabled={!formData.senderName || !formData.senderPhone || !formData.senderAddress}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next: Receiver Info
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4">Receiver Information</h2>
          <input
            type="text"
            placeholder="Receiver Name"
            value={formData.receiverName}
            onChange={(e) => handleInputChange('receiverName', e.target.value)}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Receiver Phone Number"
            value={formData.receiverPhone}
            onChange={(e) => handleInputChange('receiverPhone', e.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Receiver Address"
            value={formData.receiverAddress}
            onChange={(e) => handleInputChange('receiverAddress', e.target.value)}
            className={`${inputClass} h-24 resize-none`}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className={`flex-1 py-3 rounded-lg font-medium ${
                mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Back
            </button>
            <button
              onClick={generatePackage}
              disabled={!formData.receiverName || !formData.receiverPhone || !formData.receiverAddress}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Generate QR Code
            </button>
          </div>
        </div>
      )}

      {step === 3 && packageData && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">Package Created Successfully!</h2>
            <div className="inline-block px-4 py-2 bg-yellow-500 text-yellow-900 rounded-full font-medium">
              Status: PENDING
            </div>
          </div>

          <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="font-medium mb-2">Package ID: {packageData.packageId}</p>
            <p className="text-sm opacity-75">Created: {new Date(packageData.createdAt).toLocaleString()}</p>
          </div>

          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code" className="w-64 h-64 border-4 border-blue-500 rounded-lg" />
          </div>

          <div className="space-y-3">
            <button
              onClick={downloadQR}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
            <button
              onClick={() => {
                setStep(1);
                setFormData({
                  senderName: '',
                  senderPhone: '',
                  senderAddress: '',
                  receiverName: '',
                  receiverPhone: '',
                  receiverAddress: ''
                });
                setPackageData(null);
                setQrCode(null);
              }}
              className={`w-full py-3 rounded-lg font-medium ${
                mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Create Another Package
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReceiverFlow = ({ mode, packages, savePackages }) => {
  const [stage, setStage] = useState('scan');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState({ name: '', email: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(120);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (stage === 'otp' && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [stage, timer]);

  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      // Immediately go to info page after upload
      setStage('info');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const submitReceiverInfo = () => {
    if (!receiverInfo.name || !receiverInfo.email || !receiverInfo.phone) {
      setError('Please fill all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(receiverInfo.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Send OTP to email
    const otp = sendEmailOTP(receiverInfo.email);
    setGeneratedOtp(otp);
    setTimer(120);
    setStage('otp');
    setError('');
  };

  const verifyOTP = () => {
    if (otp !== generatedOtp) {
      setError('Invalid OTP');
      return;
    }

    // Create package data with receiver info
    const packageId = `PKG${Date.now()}`;
    const packageData = {
      packageId,
      receiver: receiverInfo,
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      qrImage: uploadedImage,
      logs: [
        { timestamp: new Date().toISOString(), event: 'Package scanned', status: 'SCANNED' },
        { timestamp: new Date().toISOString(), event: 'OTP verified', status: 'DELIVERED' }
      ]
    };

    const newPackages = { ...packages, [packageId]: packageData };
    savePackages(newPackages);
    
    setStage('delivered');
    setError('');
  };

  const declineDelivery = () => {
    setStage('returned');
  };

  useEffect(() => {
    if (stage === 'otp' && timer === 0) {
      setError('OTP expired');
      setStage('returned');
    }
  }, [timer, stage]);

  const inputClass = `w-full px-4 py-3 rounded-lg ${
    mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
  } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  return (
    <div className={`${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
      {stage === 'scan' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Scan Package QR Code</h2>
            <p className="opacity-75">Upload or scan the QR code to receive your package</p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleQRUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full py-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-5 h-5" />
              Upload QR Code
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <Camera className="w-5 h-5" />
              Scan with Camera
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}
        </div>
      )}

      {stage === 'info' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <Scan className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">QR Code Scanned Successfully</h2>
            <p className="opacity-75">Please enter your details to verify delivery</p>
          </div>

          {uploadedImage && (
            <div className="flex justify-center">
              <img 
                src={uploadedImage} 
                alt="Uploaded QR" 
                className="w-32 h-32 object-cover rounded-lg border-2 border-blue-500"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 opacity-75">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={receiverInfo.name}
                onChange={(e) => setReceiverInfo({ ...receiverInfo, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 opacity-75">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={receiverInfo.email}
                onChange={(e) => setReceiverInfo({ ...receiverInfo, email: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 opacity-75">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={receiverInfo.phone}
                onChange={(e) => setReceiverInfo({ ...receiverInfo, phone: e.target.value })}
                className={inputClass}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={declineDelivery}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
              >
                Decline Package
              </button>
              <button
                onClick={submitReceiverInfo}
                disabled={!receiverInfo.name || !receiverInfo.email || !receiverInfo.phone}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Send OTP to Email
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'otp' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Enter OTP</h2>
            <p className="opacity-75">OTP sent to {receiverInfo.email}</p>
            <div className="mt-4 text-3xl font-bold text-blue-500">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className={`${inputClass} text-center text-2xl tracking-widest`}
            />

            {error && (
              <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            <button
              onClick={verifyOTP}
              disabled={otp.length !== 6}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Verify OTP
            </button>

            <button
              onClick={() => {
                const newOtp = sendEmailOTP(receiverInfo.email);
                setGeneratedOtp(newOtp);
                setTimer(120);
                setError('');
                setOtp('');
              }}
              disabled={timer > 0}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                timer > 0 ? 'opacity-50 cursor-not-allowed' : ''
              } ${mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              <RefreshCw className="w-5 h-5" />
              Resend OTP
            </button>
          </div>

          <div className={`p-3 rounded-lg text-sm ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="opacity-75 text-center">Demo OTP: <span className="font-bold text-blue-500">{generatedOtp}</span></p>
          </div>
        </div>
      )}

      {stage === 'delivered' && (
        <div className="space-y-6 animate-fadeIn text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto animate-bounce" />
          <h2 className="text-3xl font-bold">Package Delivered Successfully!</h2>
          <div className="inline-block px-6 py-3 bg-green-500 text-white rounded-full font-medium text-lg">
            Status: DELIVERED
          </div>
          <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} text-left`}>
            <p className="font-medium mb-2">Receiver Information:</p>
            <p className="text-sm opacity-75">Name: {receiverInfo.name}</p>
            <p className="text-sm opacity-75">Email: {receiverInfo.email}</p>
            <p className="text-sm opacity-75">Phone: {receiverInfo.phone}</p>
            <p className="text-sm opacity-75 mt-3">Delivered at: {new Date().toLocaleString()}</p>
          </div>
          <button
            onClick={() => {
              setStage('scan');
              setUploadedImage(null);
              setReceiverInfo({ name: '', email: '', phone: '' });
              setOtp('');
              setError('');
            }}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
          >
            Scan Another Package
          </button>
        </div>
      )}

      {stage === 'returned' && (
        <div className="space-y-6 animate-fadeIn text-center">
          <XCircle className="w-24 h-24 text-red-500 mx-auto animate-pulse" />
          <h2 className="text-3xl font-bold">Package Declined</h2>
          <div className="inline-block px-6 py-3 bg-red-500 text-white rounded-full font-medium text-lg">
            Status: RETURN INITIATED
          </div>
          <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="font-medium mb-2">Package delivery was not completed</p>
            <p className="text-sm opacity-75">The package will be returned to the sender</p>
            <p className="text-sm opacity-75 mt-2">Postal delivery agent will collect the package</p>
          </div>
          <button
            onClick={() => {
              setStage('scan');
              setUploadedImage(null);
              setReceiverInfo({ name: '', email: '', phone: '' });
              setOtp('');
              setError('');
            }}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default PostalIdentitySystem;