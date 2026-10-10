export type Pet = {
  id: string;
  name: string;
  kind: string;
  age: string;
  note: string;
};
export type Booking = {
  id: string;
  petId: string;
  petName: string;
  serviceId: string;
  date: string;
  time: string;
  cancelled: boolean;
};
export type Account = { pets: Pet[]; bookings: Booking[] };
export type Data = { version: 1; accounts: Record<string, Account> };
export const users = [
  { id: "hari", name: "하리" },
  { id: "juni", name: "주니" },
];
export const services = [
  {
    id: "care",
    label: "돌봄",
    title: "마음 놓이는 데이케어",
    subtitle: "혼자 있는 시간도, 따뜻하게",
    price: 35000,
    duration: "4시간",
    icon: "🏡",
    color: "peach",
    description:
      "편안한 실내에서 놀이와 휴식을 함께해요. 반려동물의 속도에 맞춘 하루를 준비했어요.",
    included: [
      "성향에 맞춘 놀이와 휴식",
      "보호자가 준비한 사료 급여",
      "하루 활동 데모 리포트",
    ],
  },
  {
    id: "walk",
    label: "산책",
    title: "신나는 동네 한 바퀴",
    subtitle: "킁킁, 새로운 하루의 발견",
    price: 18000,
    duration: "60분",
    icon: "🌳",
    color: "sage",
    description:
      "익숙한 동네에서 냄새를 맡고 천천히 걸어요. 무리하지 않는 산책으로 즐거운 시간을 보내요.",
    included: [
      "반려견을 위한 일대일 산책",
      "산책 전후 물과 휴식",
      "발 닦기 및 데모 활동 기록",
    ],
  },
  {
    id: "groom",
    label: "미용",
    title: "보송보송 기분 전환",
    subtitle: "예뻐지는 시간도, 편안하게",
    price: 45000,
    duration: "90분",
    icon: "🛁",
    color: "lavender",
    description:
      "차분한 분위기에서 목욕하고 털을 정돈해요. 부담을 줄이는 휴식 시간을 함께 마련했어요.",
    included: ["순한 샴푸 목욕과 드라이", "기본 위생 미용", "상태에 맞춘 휴식"],
  },
];
export const storageKey = "pawday.demo.v1";
export function seed(): Data {
  return {
    version: 1,
    accounts: {
      hari: {
        pets: [
          {
            id: "bomi",
            name: "보미",
            kind: "강아지",
            age: "3",
            note: "공놀이를 좋아해요.",
          },
        ],
        bookings: [],
      },
      juni: { pets: [], bookings: [] },
    },
  };
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function validatePet(p: Pet): string {
  if (!p.name.trim() || p.name.trim().length > 20)
    return "이름을 1~20자로 입력해 주세요.";
  if (!["강아지", "고양이", "기타"].includes(p.kind))
    return "반려동물 종류를 선택해 주세요.";
  if (!/^\d{1,2}$/.test(p.age) || Number(p.age) > 40)
    return "나이는 0~40살로 입력해 주세요.";
  if (p.note.length > 200) return "메모는 200자 이내로 입력해 주세요.";
  return "";
}
export function validateBooking(a: Account, b: Booking): string {
  if (!a.pets.some((p) => p.id === b.petId))
    return "먼저 반려동물 프로필을 등록해 주세요.";
  if (!services.some((s) => s.id === b.serviceId))
    return "서비스를 선택해 주세요.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(b.date) ||
    Number.isNaN(Date.parse(b.date)) ||
    new Date(b.date).toISOString().slice(0, 10) !== b.date ||
    b.date < today()
  )
    return "오늘 이후의 올바른 날짜를 선택해 주세요.";
  if (
    !["10:00", "13:00", "16:00"].includes(b.time) ||
    new Date(`${b.date}T${b.time}:00`) <= new Date()
  )
    return "현재 시간 이후의 예약 시간을 선택해 주세요.";
  if (
    a.bookings.some(
      (x) => !x.cancelled && x.petId === b.petId && x.date === b.date,
    )
  )
    return "이 반려동물은 같은 날짜에 예약이 있어요. 다른 날짜를 선택해 주세요.";
  return "";
}
export function readData(raw: string | null): Data {
  if (!raw) return seed();
  const d = JSON.parse(raw) as Data;
  if (
    d.version !== 1 ||
    !d.accounts ||
    users.some(
      (u) =>
        !d.accounts[u.id] ||
        !Array.isArray(d.accounts[u.id].pets) ||
        !Array.isArray(d.accounts[u.id].bookings),
    )
  )
    throw Error("Invalid data");
  for (const a of Object.values(d.accounts)) {
    if (
      a.pets.some(
        (p) =>
          typeof p.id !== "string" ||
          typeof p.name !== "string" ||
          typeof p.kind !== "string" ||
          typeof p.age !== "string" ||
          typeof p.note !== "string",
      ) ||
      a.bookings.some(
        (b) =>
          typeof b.id !== "string" ||
          typeof b.petId !== "string" ||
          typeof b.petName !== "string" ||
          !services.some((s) => s.id === b.serviceId) ||
          typeof b.date !== "string" ||
          typeof b.time !== "string" ||
          typeof b.cancelled !== "boolean",
      )
    )
      throw Error("Invalid records");
  }
  return d;
}
