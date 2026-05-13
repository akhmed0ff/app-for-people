import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useDriverRealtime } from '../../src/features/orders/useDriverRealtime';
import { useOfferStore } from '../../src/shared/store/offer.store';
import { Button } from '../../src/shared/ui/Button';
import { OrderOfferCard } from '../../src/shared/ui/OrderOfferCard';
import { Screen, Section } from '../../src/shared/ui/Screen';

export default function CurrentOfferScreen() {
  const { online, connecting, currentOffer, activeOrder, goOnline, goOffline } = useDriverRealtime();
  const secondsLeft = useOfferStore((state) => state.secondsLeft);
  const isLoading = useOfferStore((state) => state.isLoading);
  const isAccepting = useOfferStore((state) => state.isAccepting);
  const isRejecting = useOfferStore((state) => state.isRejecting);
  const error = useOfferStore((state) => state.error);
  const notice = useOfferStore((state) => state.notice);
  const fetchCurrentOffer = useOfferStore((state) => state.fetchCurrentOffer);
  const acceptOffer = useOfferStore((state) => state.acceptOffer);
  const rejectOffer = useOfferStore((state) => state.rejectOffer);

  useEffect(() => {
    if (online) {
      void fetchCurrentOffer();
    }
  }, [fetchCurrentOffer, online]);

  async function accept() {
    const result = await acceptOffer();
    if (result.ok && result.orderId) {
      router.push(`/trip/${result.orderId}`);
      return;
    }
    const latestError = useOfferStore.getState().error;
    const latestNotice = useOfferStore.getState().notice;
    if (latestError || latestNotice) {
      Alert.alert(latestError ?? latestNotice ?? '');
    }
  }

  async function reject() {
    const rejected = await rejectOffer();
    if (rejected) {
      Alert.alert('Заказ отклонен');
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Предложения</Text>
      <Section>
        <Text style={styles.status}>
          {activeOrder ? 'Вы заняты' : online ? 'Вы онлайн' : 'Вы оффлайн'}
        </Text>
        {activeOrder ? (
          <Button label="Открыть активную поездку" onPress={() => router.push(`/trip/${activeOrder.id}`)} />
        ) : (
          <Button
            disabled={connecting}
            label={online ? 'Уйти с линии' : 'Выйти онлайн'}
            onPress={online ? goOffline : goOnline}
            variant={online ? 'danger' : 'primary'}
          />
        )}
      </Section>

      <View style={styles.list}>
        {currentOffer ? (
          <OrderOfferCard
            accepting={isAccepting}
            offer={currentOffer}
            onAccept={accept}
            onReject={reject}
            rejecting={isRejecting}
            secondsLeft={secondsLeft}
          />
        ) : (
          <Section>
            <Text style={styles.empty}>
              {online ? 'Пока нет заказов. Оставайтесь онлайн.' : 'Выйдите онлайн, чтобы получать предложения.'}
            </Text>
            {online ? (
              <Button
                disabled={isLoading}
                label={isLoading ? 'Проверяем...' : 'Обновить'}
                onPress={() => void fetchCurrentOffer()}
                variant="secondary"
              />
            ) : null}
          </Section>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice && !currentOffer ? <Text style={styles.notice}>{notice}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#667085', fontSize: 16, fontWeight: '700' },
  error: { color: '#dc2626', fontWeight: '800' },
  list: { gap: 12, marginTop: 16 },
  notice: { color: '#1d4ed8', fontWeight: '800' },
  status: { color: '#17202a', fontSize: 18, fontWeight: '900' },
  title: { color: '#17202a', fontSize: 28, fontWeight: '900', marginBottom: 16 },
});
