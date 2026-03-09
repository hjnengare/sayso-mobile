import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { routes } from '../../../../src/navigation/routes';

export default function BusinessReviewsRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    router.replace(routes.writeReview('business', id) as never);
  }, [id, router]);

  return null;
}
