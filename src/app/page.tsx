import ArticleLoader from "@/components/ArticleLoader";
import NewspaperHeader from "@/components/NewspaperHeader";

export default async function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f7f2' }}>
      <div className="max-w-6xl mx-auto">
        {/* Newspaper Masthead */}
        <NewspaperHeader />

        {/* Main Content */}
        <div className="p-8">
          <ArticleLoader />
        </div>
      </div>
    </div>
  );
}
