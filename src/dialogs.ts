import { Alert, Platform } from 'react-native';

// Alert.alert não funciona no React Native Web; aqui cobrimos web e nativo.
export function aviso(titulo: string, msg?: string) {
  if (Platform.OS === 'web') window.alert(msg ? `${titulo}\n${msg}` : titulo);
  else Alert.alert(titulo, msg);
}

export function confirmar(msg: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(msg));
  return new Promise((resolve) =>
    Alert.alert('Confirmar', msg, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmar', onPress: () => resolve(true) },
    ])
  );
}

export function pedirTexto(msg: string): string | null {
  return Platform.OS === 'web' ? window.prompt(msg) : null;
}
