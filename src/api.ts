export async function getLiveVideos(
  channel: string,
  token: string,
  scheduled = false,
): Promise<gapi.client.youtube.SearchListResponse> {
  const url = new URL('https://youtube.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', channel);
  url.searchParams.set('eventType', scheduled ? 'upcoming' : 'live');
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('type', 'video');
  url.searchParams.set('key', token);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const data: gapi.client.youtube.SearchListResponse = await response.json();
  console.log(data.items);
  return data;
}
//  'https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=UC3ljd02xXVI28g63pQb9t0w&eventType=live&maxResults=25&type=video&key=[YOUR_API_KEY]' \
