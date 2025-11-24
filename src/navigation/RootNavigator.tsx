import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fontSize } from '../constants/colors';

import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import PrivacyPolicyScreen from '../screens/auth/PrivacyPolicyScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import StrategyDetailScreen from '../screens/StrategyDetailScreen';
import MyStrategiesScreen from '../screens/MyStrategiesScreen';
import LikedStrategiesScreen from '../screens/LikedStrategiesScreen';
import RequestSubmitScreen from '../screens/RequestSubmitScreen';
import RequestListScreen from '../screens/RequestListScreen';
import StrategyEditScreen from '../screens/StrategyEditScreen';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  ProfileEdit: undefined;
  StrategyDetail: { strategy_no: number };
  StrategyEdit: { strategy_no: number };
  MyStrategies: undefined;
  LikedStrategies: undefined;
  RequestSubmit: undefined;
  RequestList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: fontSize.lg,
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        headerBackTitle: '',
      }}
    >
      {/* メインタブ（常に表示可能） */}
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      {/* 認証関連画面（モーダルとして表示） */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ title: '新規登録' }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: 'パスワードをお忘れの方' }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{ title: '利用規約' }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ title: 'プライバシーポリシー' }}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{ title: 'プロフィール編集' }}
        />
        <Stack.Screen
          name="StrategyDetail"
          component={StrategyDetailScreen}
          options={{ title: '攻略情報' }}
        />
        <Stack.Screen
          name="StrategyEdit"
          component={StrategyEditScreen}
          options={{ title: '攻略情報編集' }}
        />
        <Stack.Screen
          name="MyStrategies"
          component={MyStrategiesScreen}
          options={{ title: '自分の攻略情報' }}
        />
        <Stack.Screen
          name="LikedStrategies"
          component={LikedStrategiesScreen}
          options={{ title: 'いいねした攻略情報' }}
        />
        <Stack.Screen
          name="RequestSubmit"
          component={RequestSubmitScreen}
          options={{ title: '要望送信' }}
        />
        <Stack.Screen
          name="RequestList"
          component={RequestListScreen}
          options={{ title: '要望一覧' }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}
