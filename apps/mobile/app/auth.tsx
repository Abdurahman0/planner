import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStore } from '../src/store/useStore';

const authSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/\d/, 'Password must include a number'),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthScreen() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);
  const login = useStore((state) => state.login);
  const register = useStore((state) => state.register);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const { control, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [router, user]);

  const submitLabel = useMemo(
    () => (mode === 'login' ? 'Sign In' : 'Create Account'),
    [mode],
  );

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (mode === 'login') {
        await login(data.email, data.password);
      } else {
        await register(data.email, data.password);
      }

      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      Alert.alert('Authentication Failed', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>AI Planner</Text>
        <Text style={styles.subtitle}>Sign in to your real backend account.</Text>

        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.modeButtonText, mode === 'login' && styles.modeButtonTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.modeButtonText, mode === 'register' && styles.modeButtonTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="you@example.com"
                placeholderTextColor="#555"
                style={[styles.input, errors.email && styles.inputError]}
                value={value}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Minimum 12 chars"
                placeholderTextColor="#555"
                secureTextEntry
                style={[styles.input, errors.password && styles.inputError]}
                value={value}
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        <TouchableOpacity
          disabled={isLoading}
          onPress={handleSubmit(onSubmit)}
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>{isLoading ? 'Loading...' : submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#111',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#050505',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#A855F7',
  },
  modeButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#A855F7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
