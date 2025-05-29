import VocabStats from "@/components/VocabStats";
import ArticleLoader from "@/components/ArticleLoader";
import NewspaperHeader from "@/components/NewspaperHeader";

async function getRedditPosts() {
  const NUMBER_OF_POSTS = 15;

  try {
    // Get access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: process.env.REDDIT_USERNAME!,
        password: process.env.REDDIT_PASSWORD!,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get top posts from r/France
    const postsResponse = await fetch(
      `https://oauth.reddit.com/r/France/hot?limit=${NUMBER_OF_POSTS}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MyApp/1.0.0',
        },
      }
    );

    const postsData = await postsResponse.json();
    return postsData.data.children
      .filter((post: any) => post.data.selftext.length > 0)
      .map((post: any) => ({
        title: post.data.title,
        content: post.data.selftext,
        url: `https://reddit.com${post.data.permalink}`,
        score: post.data.score,
        author: post.data.author,
      }));

  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return [];
  }
}

export default async function Home() {
  const posts = await getRedditPosts();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f7f2' }}>
      <div className="max-w-6xl mx-auto">
        {/* Newspaper Masthead */}
        <NewspaperHeader />

        {/* Main Content */}
        <div className="p-8">
          <ArticleLoader posts={posts} />
        </div>
      </div>
    </div>
  );
}
