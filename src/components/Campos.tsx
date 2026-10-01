import { View, Text, TextInput, Platform } from 'react-native';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { s } from '../styles';

type CampoProps = TextInputProps & { label: string; estilo?: StyleProp<ViewStyle> };

export function Campo({ label, estilo, multiline, ...props }: CampoProps) {
  return (
    <View style={[s.campo, estilo]}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={[s.input, multiline && s.inputMulti]} multiline={multiline} {...props} />
    </View>
  );
}

const inputData = {
  border: '1px solid #D8DBD5', borderRadius: 7, padding: '9px 10px', fontSize: 14,
  backgroundColor: '#F3F4F1', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
} as const;

/** Seletor de data nativo do navegador; no mobile cai para texto AAAA-MM-DD. */
export function CampoData(p: { label: string; value: string; onChange: (v: string) => void; estilo?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.campo, p.estilo]}>
      <Text style={s.label}>{p.label}</Text>
      {Platform.OS === 'web' ? (
        <input type="date" value={p.value} onChange={(e) => p.onChange(e.target.value)} style={inputData} />
      ) : (
        <TextInput style={s.input} value={p.value} onChangeText={p.onChange} placeholder="AAAA-MM-DD" />
      )}
    </View>
  );
}
