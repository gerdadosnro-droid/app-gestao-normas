import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { supabase } from '../supabase';
import { aviso } from '../dialogs';
import { Campo } from './Campos';
import { s } from '../styles';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setEntrando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEntrando(false);
    if (error) aviso('Não foi possível entrar', error.message);
  }

  return (
    <View style={s.centro}>
      <View style={[s.modal, { padding: 22 }]}>
        <Text style={s.h2}>Controle de Normas</Text>
        <Campo label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Campo label="Senha" value={senha} onChangeText={setSenha} secureTextEntry onSubmitEditing={entrar} />
        <Pressable style={s.btn} onPress={entrar} disabled={entrando}>
          {entrando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Entrar</Text>}
        </Pressable>
      </View>
    </View>
  );
}
