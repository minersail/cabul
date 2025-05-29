import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Reddit access token: ${tokenResponse.status}`);
    }

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

    if (!postsResponse.ok) {
      throw new Error(`Failed to fetch Reddit posts: ${postsResponse.status}`);
    }

    const postsData = await postsResponse.json();
    const posts = postsData.data.children
      .filter((post: any) => post.data.selftext.length > 0)
      .map((post: any) => ({
        title: post.data.title,
        content: post.data.selftext,
        url: `https://reddit.com${post.data.permalink}`,
        score: post.data.score,
        author: post.data.author,
      }));

    return NextResponse.json({
      success: true,
      posts,
      totalPosts: posts.length,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch Reddit posts',
        posts: []
      },
      { status: 500 }
    );
  }
} 