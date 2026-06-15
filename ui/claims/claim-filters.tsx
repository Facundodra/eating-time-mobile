import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDownIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import {
  claimSortLabels,
  claimStatusShortLabels,
  type ClaimSortKey,
} from '@/lib/cliente/claim-utils';
import { formatDatePickerLabel } from '@/lib/cliente/order-utils';
import type { ClientClaimRestaurant } from '@/services/cliente/claim-service';

import OptionPickerModal from '../orders/option-picker-modal';

type Props = {
  sort: ClaimSortKey;
  localId: string;
  status: string;
  pedidoId: string;
  desde: Date | null;
  hasta: Date | null;
  restaurants: ClientClaimRestaurant[];
  restaurantsLoading: boolean;
  controlsDisabled: boolean;
  onSortChange: (sort: ClaimSortKey) => void;
  onLocalIdChange: (localId: string) => void;
  onStatusChange: (status: string) => void;
  onPedidoIdChange: (pedidoId: string) => void;
  onDesdeChange: (date: Date | null) => void;
  onHastaChange: (date: Date | null) => void;
  onApplyFilters: () => void;
};

type DateField = 'desde' | 'hasta' | null;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: claimStatusShortLabels.PENDIENTE },
  { value: 'APROBADO', label: claimStatusShortLabels.APROBADO },
  { value: 'RECHAZADO', label: claimStatusShortLabels.RECHAZADO },
];

export default function ClaimFilters({
  sort,
  localId,
  status,
  pedidoId,
  desde,
  hasta,
  restaurants,
  restaurantsLoading,
  controlsDisabled,
  onSortChange,
  onLocalIdChange,
  onStatusChange,
  onPedidoIdChange,
  onDesdeChange,
  onHastaChange,
  onApplyFilters,
}: Props) {
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [localPickerOpen, setLocalPickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateField>(null);
  const [androidPickerDate, setAndroidPickerDate] = useState(new Date());

  const localLabel =
    localId === ''
      ? restaurantsLoading
        ? 'Cargando locales...'
        : 'Todos los locales'
      : restaurants.find((r) => String(r.id) === localId)?.name ?? `Local #${localId}`;

  const statusLabel =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? 'Todos los estados';

  function openDatePicker(field: 'desde' | 'hasta') {
    if (controlsDisabled) return;
    const current = field === 'desde' ? desde : hasta;
    setAndroidPickerDate(current ?? new Date());
    setActiveDateField(field);
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setActiveDateField(null);
    if (event.type === 'dismissed' || !date) return;

    if (activeDateField === 'desde') onDesdeChange(date);
    if (activeDateField === 'hasta') onHastaChange(date);
  }

  const sortOptions = (Object.keys(claimSortLabels) as ClaimSortKey[]).map((key) => ({
    value: key,
    label: claimSortLabels[key],
  }));

  const localOptions = [
    { value: '', label: restaurantsLoading ? 'Cargando locales...' : 'Todos los locales' },
    ...restaurants.map((r) => ({ value: String(r.id), label: r.name })),
  ];

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.pickerBtn, controlsDisabled && styles.pickerBtnDisabled]}
        onPress={() => setSortPickerOpen(true)}
        disabled={controlsDisabled}
      >
        <Text style={styles.pickerLabel}>Ordenar por</Text>
        <View style={styles.pickerValueRow}>
          <Text style={styles.pickerValue} numberOfLines={1}>{claimSortLabels[sort]}</Text>
          <ChevronDownIcon size={16} color={Brand.gray400} />
        </View>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.pickerBtn, styles.half, controlsDisabled && styles.pickerBtnDisabled]}
          onPress={() => setLocalPickerOpen(true)}
          disabled={controlsDisabled}
        >
          <Text style={styles.pickerLabel}>Local</Text>
          <View style={styles.pickerValueRow}>
            <Text style={styles.pickerValue} numberOfLines={1}>{localLabel}</Text>
            <ChevronDownIcon size={16} color={Brand.gray400} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickerBtn, styles.half, controlsDisabled && styles.pickerBtnDisabled]}
          onPress={() => setStatusPickerOpen(true)}
          disabled={controlsDisabled}
        >
          <Text style={styles.pickerLabel}>Estado</Text>
          <View style={styles.pickerValueRow}>
            <Text style={styles.pickerValue} numberOfLines={1}>{statusLabel}</Text>
            <ChevronDownIcon size={16} color={Brand.gray400} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.pickerLabel}>Pedido #</Text>
        <TextInput
          style={[styles.input, controlsDisabled && styles.inputDisabled]}
          value={pedidoId}
          onChangeText={onPedidoIdChange}
          placeholder="Ej: 42"
          placeholderTextColor={Brand.gray400}
          keyboardType="number-pad"
          editable={!controlsDisabled}
        />
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.pickerBtn, styles.half, controlsDisabled && styles.pickerBtnDisabled]}
          onPress={() => openDatePicker('desde')}
          disabled={controlsDisabled}
        >
          <Text style={styles.pickerLabel}>Desde</Text>
          <Text style={styles.pickerValue}>{formatDatePickerLabel(desde)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickerBtn, styles.half, controlsDisabled && styles.pickerBtnDisabled]}
          onPress={() => openDatePicker('hasta')}
          disabled={controlsDisabled}
        >
          <Text style={styles.pickerLabel}>Hasta</Text>
          <Text style={styles.pickerValue}>{formatDatePickerLabel(hasta)}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.applyBtn, controlsDisabled && styles.applyBtnDisabled]}
        onPress={onApplyFilters}
        disabled={controlsDisabled}
      >
        <Text style={styles.applyBtnText}>Aplicar filtros</Text>
      </TouchableOpacity>

      {restaurantsLoading ? (
        <Text style={styles.hint}>Cargando locales... los filtros se habilitarán en un momento.</Text>
      ) : null}

      <OptionPickerModal
        visible={sortPickerOpen}
        title="Ordenar por"
        options={sortOptions}
        selectedValue={sort}
        onSelect={onSortChange}
        onClose={() => setSortPickerOpen(false)}
      />

      <OptionPickerModal
        visible={localPickerOpen}
        title="Local"
        options={localOptions}
        selectedValue={localId}
        onSelect={onLocalIdChange}
        onClose={() => setLocalPickerOpen(false)}
      />

      <OptionPickerModal
        visible={statusPickerOpen}
        title="Estado"
        options={STATUS_OPTIONS}
        selectedValue={status}
        onSelect={onStatusChange}
        onClose={() => setStatusPickerOpen(false)}
      />

      {activeDateField && Platform.OS === 'ios' ? (
        <DateTimePicker
          value={androidPickerDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
        />
      ) : null}

      {activeDateField && Platform.OS === 'android' ? (
        <DateTimePicker
          value={androidPickerDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  pickerBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerBtnDisabled: { opacity: 0.6 },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.gray400,
    marginBottom: 4,
  },
  pickerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  pickerValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Brand.gray800,
  },
  field: { gap: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Brand.gray800,
  },
  inputDisabled: { opacity: 0.6 },
  applyBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    fontSize: 11,
    color: Brand.gray400,
  },
});
