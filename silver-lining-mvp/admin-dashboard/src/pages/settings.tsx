import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      platformName: 'Silver Lining',
      supportEmail: 'support@silverlining.com',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'English'
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      passwordPolicy: 'strong',
      ipWhitelist: false,
      auditLogging: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      kycAlerts: true,
      transactionAlerts: true,
      systemAlerts: true
    },
    payment: {
      razorpayEnabled: true,
      stripeEnabled: false,
      upiEnabled: true,
      minimumAmount: 10,
      maximumAmount: 1000000
    }
  });

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'payment', name: 'Payment', icon: CurrencyDollarIcon }
  ];

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gradient">Settings</h1>
          <p className="mt-2 text-lg text-dark-tertiary">
            Manage platform configuration and preferences
          </p>
        </motion.div>

        {/* Settings tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="premium-card"
        >
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm flex items-center space-x-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-dark-secondary hover:text-dark-primary hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                    <Cog6ToothIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    General Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-dark-secondary mb-2">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        value={settings.general.platformName}
                        onChange={(e) => handleSettingChange('general', 'platformName', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-secondary mb-2">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-secondary mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                        className="input-field"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-secondary mb-2">
                        Currency
                      </label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                        className="input-field"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Security Configuration
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 premium-card">
                      <div>
                        <h4 className="text-sm font-semibold text-dark-primary">Two-Factor Authentication</h4>
                        <p className="text-sm text-dark-tertiary">Require 2FA for admin accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorAuth}
                          onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 premium-card">
                      <div>
                        <h4 className="text-sm font-semibold text-dark-primary">Audit Logging</h4>
                        <p className="text-sm text-dark-tertiary">Log all admin actions for security</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.auditLogging}
                          onChange={(e) => handleSettingChange('security', 'auditLogging', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 premium-card">
                      <label className="block text-sm font-semibold text-dark-secondary mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="input-field"
                        min="5"
                        max="480"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                    <BellIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Notification Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="premium-card p-4">
                      <h4 className="text-sm font-semibold text-dark-primary mb-3">Email Notifications</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.emailNotifications}
                            onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                          />
                          <span className="ml-2 text-sm text-dark-secondary">Enable email notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.kycAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'kycAlerts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                          />
                          <span className="ml-2 text-sm text-dark-secondary">KYC alerts</span>
                        </label>
                      </div>
                    </div>
                    <div className="premium-card p-4">
                      <h4 className="text-sm font-semibold text-dark-primary mb-3">System Alerts</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.systemAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                          />
                          <span className="ml-2 text-sm text-dark-secondary">System maintenance alerts</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.transactionAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'transactionAlerts', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                          />
                          <span className="ml-2 text-sm text-dark-secondary">Transaction alerts</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-dark-primary mb-6 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Payment Configuration
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="premium-card p-4">
                        <h4 className="text-sm font-semibold text-dark-primary mb-3">Payment Gateways</h4>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={settings.payment.razorpayEnabled}
                              onChange={(e) => handleSettingChange('payment', 'razorpayEnabled', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                            />
                            <span className="ml-2 text-sm text-dark-secondary">Razorpay</span>
                          </label>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={settings.payment.stripeEnabled}
                              onChange={(e) => handleSettingChange('payment', 'stripeEnabled', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                            />
                            <span className="ml-2 text-sm text-dark-secondary">Stripe</span>
                          </label>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={settings.payment.upiEnabled}
                              onChange={(e) => handleSettingChange('payment', 'upiEnabled', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
                            />
                            <span className="ml-2 text-sm text-dark-secondary">UPI</span>
                          </label>
                        </div>
                      </div>
                      <div className="premium-card p-4">
                        <h4 className="text-sm font-semibold text-dark-primary mb-3">Transaction Limits</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-dark-secondary mb-1">
                              Minimum Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={settings.payment.minimumAmount}
                              onChange={(e) => handleSettingChange('payment', 'minimumAmount', parseInt(e.target.value))}
                              className="input-field"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-dark-secondary mb-1">
                              Maximum Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={settings.payment.maximumAmount}
                              onChange={(e) => handleSettingChange('payment', 'maximumAmount', parseInt(e.target.value))}
                              className="input-field"
                              min="1000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Settings; 