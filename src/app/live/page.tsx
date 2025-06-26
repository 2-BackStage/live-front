import LiveList from "../../components/LiveList";

export default async function LiveListPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_LIVE_API_URL}/all?size=10`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("라이브 방송 목록을 불러오는 데 실패했습니다.");
  }

  const result = await res.json();
  const initialData = result.result;

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">🔥 라이브 방송</h1>
      <LiveList initialData={initialData} />
    </main>
  );
}