import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRightIcon } from 'react-native-heroicons/outline';
import type { ComponentType } from 'react';

import { Brand } from '@/constants/theme';

type IconProps = { size?: number; color?: string };

type Props = {
  title: string;
  description?: string;
  icon: ComponentType<IconProps>;
  onPress: () => void;
  badge?: string | number;
  danger?: boolean;
  showDivider?: boolean;
};

export default function AccountMenuRow({
  title,
  description,
  icon: Icon,
  onPress,
  badge,
  danger = false,
  showDivider = true,
}: Props) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
          <Icon size={20} color={danger ? '#DC2626' : Brand.gray600} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, danger && styles.titleDanger]}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {badge != null && Number(badge) > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {typeof badge === 'number' && badge > 9 ? '9+' : badge}
            </Text>
          </View>
        ) : null}
        <ChevronRightIcon size={18} color={Brand.gray400} />
      </TouchableOpacity>
      {showDivider ? <View style={styles.divider} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Brand.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#FEF2F2',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.black,
  },
  titleDanger: {
    color: '#DC2626',
  },
  description: {
    marginTop: 2,
    fontSize: 12,
    color: Brand.gray400,
    lineHeight: 16,
  },
  badge: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: Brand.gray100,
    marginLeft: 64,
  },
});
