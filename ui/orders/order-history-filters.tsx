import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDownIcon } from 'react-native-heroicons/outline';

import { Brand } from '@/constants/theme';
import {
  formatDatePickerLabel,
  sortLabels,
  type SortKey,
} from '@/lib/cliente/order-utils';
import type { OrderHistoryRestaurant } from '@/services/cliente/cliente-service';

import OptionPickerModal from './option-picker-modal';

type Props = {
  sort: SortKey;
  localId: string;
  desde: Date | null;
  hasta: Date | null;
  restaurants: OrderHistoryRestaurant[];
  restaurantsLoading: boolean;
  controlsDisabled: boolean;
  hasNoOrdersAtAll: boolean;
  onSortChange: (sort: SortKey) => void;
  onLocalIdChange: (localId: string) => void;
  onDesdeChange: (date: Date | null) => void;
  onHastaChange: (date: Date | null) => void;
  onApplyFilters: () => void;
};

type DateField = 'desde' | 'hasta' | null;

export default function OrderHistoryFilters({
  sort,
  localId,
  desde,
  hasta,
  restaurants,
  restaurantsLoading,
  controlsDisabled,
  hasNoOrdersAtAll,
  onSortChange,
  onLocalIdChange,
  onDesdeChange,
  onHastaChange,
  onApplyFilters,
}: Props) {
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [localPickerOpen, setLocalPickerOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateField>(null);
  const [androidPickerDate, setAndroidPickerDate] = useState(new Date());

  const localLabel =
    localId === ''
      ? restaurantsLoading
        ? 'Cargando locales...'
        : 'Todos los locales'
      : restaurants.find((r) => String(r.id) === localId)?.name ?? `Local #${localId}`;

  function openDatePicker(field: 'desde' | 'hasta') {
    if (controlsDisabled) return;
    const current = field === 'desde' ? desde : hasta;
    setAndroidPickerDate(current ?? new Date());
    setActiveDateField(field);
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setActiveDateField(null);
    }

    if (event.type === 'dismissed' || !date) return;

    if (activeDateField === 'desde') {
      onDesdeChange(date);
      if (Platform.OS === 'ios') setActiveDateField(null);
      return;
    }

    if (activeDateField === 'hasta') {
      onHastaChange(date);
      if (Platform.OS === 'ios') setActiveDateField(null);
    }
  }

  const sortOptions = (Object.keys(sortLabels) as SortKey[]).map((key) => ({
    value: key,
    label: sortLabels[key],
  }));

  const localOptions = [
    { value: '', label: restaurantsLoading ? 'Cargando locales...' : 'Todos los locales' },
    ...restaurants.map((r) => ({ value: String(r.id), label: r.name })),
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Filtros</Text>

      <Text style={styles.label}>Ordenar por</Text>
      <TouchableOpacity
        style={[styles.select, controlsDisabled && styles.selectDisabled]}
        onPress={() => !controlsDisabled && setSortPickerOpen(true)}
        disabled={controlsDisabled}
      >
        <Text style={[styles.selectText, controlsDisabled && styles.selectTextDisabled]} numberOfLines={1}>
          {sortLabels[sort]}
        </Text>
        <ChevronDownIcon size={18} color={Brand.gray400} />
      </TouchableOpacity>

      <Text style={styles.label}>Local</Text>
      <TouchableOpacity
        style={[styles.select, controlsDisabled && styles.selectDisabled]}
        onPress={() => !controlsDisabled && setLocalPickerOpen(true)}
        disabled={controlsDisabled}
      >
        <Text style={[styles.selectText, controlsDisabled && styles.selectTextDisabled]} numberOfLines={1}>
          {localLabel}
        </Text>
        <ChevronDownIcon size={18} color={Brand.gray400} />
      </TouchableOpacity>

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.label}>Desde</Text>
          <TouchableOpacity
            style={[styles.select, controlsDisabled && styles.selectDisabled]}
            onPress={() => openDatePicker('desde')}
            disabled={controlsDisabled}
          >
            <Text style={[styles.selectText, controlsDisabled && styles.selectTextDisabled]}>
              {formatDatePickerLabel(desde)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateField}>
          <Text style={styles.label}>Hasta</Text>
          <TouchableOpacity
            style={[styles.select, controlsDisabled && styles.selectDisabled]}
            onPress={() => openDatePicker('hasta')}
            disabled={controlsDisabled}
          >
            <Text style={[styles.selectText, controlsDisabled && styles.selectTextDisabled]}>
              {formatDatePickerLabel(hasta)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {(desde || hasta) && !controlsDisabled ? (
        <TouchableOpacity
          onPress={() => {
            onDesdeChange(null);
            onHastaChange(null);
          }}
        >
          <Text style={styles.clearDates}>Limpiar fechas</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.applyBtn, (controlsDisabled || hasNoOrdersAtAll) && styles.applyBtnDisabled]}
        onPress={onApplyFilters}
        disabled={controlsDisabled || hasNoOrdersAtAll}
      >
        <Text style={styles.applyBtnText}>Aplicar filtros</Text>
      </TouchableOpacity>

      {restaurantsLoading ? (
        <Text style={styles.hint}>Cargando locales… los filtros se habilitarán en un momento.</Text>
      ) : null}

      {activeDateField && Platform.OS === 'ios' ? (
        <View style={styles.iosPickerWrap}>
          <DateTimePicker
            value={activeDateField === 'desde' ? (desde ?? new Date()) : (hasta ?? new Date())}
            mode="date"
            display="spinner"
            locale="es-UY"
            onChange={handleDateChange}
          />
          <TouchableOpacity style={styles.iosPickerDone} onPress={() => setActiveDateField(null)}>
            <Text style={styles.iosPickerDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {activeDateField && Platform.OS === 'android' ? (
        <DateTimePicker
          value={androidPickerDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.gray200,
    padding: 16,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.black,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.gray600,
    marginTop: 6,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectDisabled: {
    backgroundColor: Brand.gray100,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: Brand.gray800,
    marginRight: 8,
  },
  selectTextDisabled: {
    color: Brand.gray400,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dateField: {
    flex: 1,
  },
  clearDates: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.primary,
    marginTop: 4,
  },
  applyBtn: {
    marginTop: 12,
    backgroundColor: Brand.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#FDBA74',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    fontSize: 11,
    color: Brand.gray400,
    marginTop: 4,
  },
  iosPickerWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Brand.gray200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  iosPickerDone: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.gray200,
    backgroundColor: Brand.gray100,
  },
  iosPickerDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.primary,
  },
});
