import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { createAddress, updateAddress, getAddresses, Address } from '../services/addressService';
import { colors, spacing } from '../constants/theme';
import { NavigationProps } from '../navigation/AppNavigator';
import { Icons } from '../components/Icon';

interface AddressEditScreenProps extends Partial<NavigationProps> {
  addressId?: number;
}

export function AddressEditScreen({ onGoBack, addressId }: AddressEditScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (addressId) {
      loadAddress();
    }
  }, [addressId]);

  const loadAddress = async () => {
    try {
      const addresses = await getAddresses();
      const address = addresses.find((a: Address) => a.id === addressId);
      if (address) {
        setName(address.name);
        setPhone(address.phone);
        setProvince(address.province || '');
        setCity(address.city || '');
        setDistrict(address.district || '');
        setDetailAddress(address.detail_address);
        setIsDefault(address.is_default);
        setIsEdit(true);
      }
    } catch (error) {
      console.error('Failed to load address:', error);
    }
  };

  const handleSave = async () => {
    if (!name || !phone || !detailAddress) {
      Alert.alert('提示', '请填写收货人、电话和详细地址');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name,
        phone,
        province,
        city,
        district,
        detail_address: detailAddress,
        is_default: isDefault,
      };

      if (isEdit && addressId) {
        await updateAddress(addressId, data);
      } else {
        await createAddress(data);
      }

      if (onGoBack) {
        onGoBack();
      }
    } catch (error) {
      Alert.alert('错误', '保存地址失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
            <Icons.ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? '编辑地址' : '新增地址'}</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>收货人</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="请输入收货人姓名"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>联系电话</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="请输入联系电话"
            keyboardType="phone-pad"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>省份</Text>
          <TextInput
            style={styles.input}
            value={province}
            onChangeText={setProvince}
            placeholder="请输入省份"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>城市</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="请输入城市"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>区/县</Text>
          <TextInput
            style={styles.input}
            value={district}
            onChangeText={setDistrict}
            placeholder="请输入区/县"
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>详细地址</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={detailAddress}
            onChangeText={setDetailAddress}
            placeholder="请输入详细地址"
            multiline
            placeholderTextColor={colors['text-tertiary']}
          />
        </View>

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsDefault(!isDefault)}>
          <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
            {isDefault && <Icons.Check size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>设为默认地址</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveBtnText}>{loading ? '保存中...' : '保存地址'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { backgroundColor: colors.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingTop: spacing.xl * 1.5, paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  placeholder: { width: 36 },
  form: { flex: 1, padding: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 14, color: colors['text-secondary'], marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, fontSize: 16, color: colors.text, backgroundColor: colors.white },
  textArea: { height: 80, textAlignVertical: 'top' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  checkboxChecked: { backgroundColor: colors.primary },
  checkboxLabel: { fontSize: 14, color: colors.text },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.md, margin: spacing.md, borderRadius: 24, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
