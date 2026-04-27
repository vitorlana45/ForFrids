export async function deleteUploadedMedia(urls: string | string[]) {
  const targets = Array.isArray(urls) ? urls : [urls];

  await Promise.allSettled(
    targets
      .filter(Boolean)
      .map((url) =>
        fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        }),
      ),
  );
}
