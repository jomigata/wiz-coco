import CounselorCategoryHubPageClient from './CounselorCategoryHubPageClient';
import { counselorMenuCategories } from '@/data/counselorMenu';

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return counselorMenuCategories.map((category) => ({
    slug: category.slug,
  }));
}

export default function CounselorCategoryHubPage({ params }: Props) {
  return <CounselorCategoryHubPageClient slug={params.slug} />;
}
