import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  PawPrint,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Heart,
  ShieldCheck,
  Menu,
  X,
  Plus,
  Check,
  MapPin,
} from "lucide-react";
import {
  type Pet,
  type Booking,
  type Data,
  services,
  users,
  seed,
  readData,
  storageKey,
  today,
  validatePet,
  validateBooking,
} from "./model";
import "./style.css";
function initial() {
  try {
    return { data: readData(localStorage.getItem(storageKey)), error: "" };
  } catch {
    return {
      data: seed(),
      error:
        "저장 데이터를 읽지 못했어요. 임시 데모로 시작합니다. 저장 초기화로 복구할 수 있어요.",
    };
  }
}
const initialState = initial();
function App() {
  const [data, setData] = useState<Data>(initialState.data),
    [storageError, setStorageError] = useState(initialState.error),
    [user, setUser] = useState("hari");
  const [page, setPage] = useState("home"),
    [filter, setFilter] = useState("전체"),
    [mobile, setMobile] = useState(false),
    [message, setMessage] = useState("");
  const [detail, setDetail] = useState<string | null>(null),
    [petEdit, setPetEdit] = useState<Pet | null>(null),
    [bookingService, setBookingService] = useState<string | null>(null),
    [cancel, setCancel] = useState<Booking | null>(null),
    [reset, setReset] = useState(false),
    [formError, setFormError] = useState("");
  const account = data.accounts[user];
  const currentUser = users.find((u) => u.id === user)!;
  const modal = !!(detail || petEdit || bookingService || cancel || reset);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [modal]);
  function trapDialogFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const elements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
      ),
    );
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  function close() {
    setDetail(null);
    setPetEdit(null);
    setBookingService(null);
    setCancel(null);
    setReset(false);
    setFormError("");
  }
  function navigate(p: string) {
    setPage(p);
    setMobile(false);
    setMessage("");
    requestAnimationFrame(() => {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  function save(next: Data) {
    setData(next);
    try {
      if (storageError) {
        setMessage(
          "현재 임시 저장 모드입니다. 변경은 새로고침하면 사라질 수 있어요.",
        );
        return;
      }
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setStorageError(
        "브라우저 저장 공간에 접근할 수 없어요. 변경은 이번 화면에서만 유지됩니다.",
      );
    }
  }
  function startBooking(id: string) {
    setDetail(null);
    setFormError("");
    setBookingService(id);
  }
  function petSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pet = {
      id: petEdit!.id,
      name: String(f.get("name")).trim(),
      kind: String(f.get("kind")),
      age: String(f.get("age")),
      note: String(f.get("note")).trim(),
    };
    const err = validatePet(pet);
    if (err) {
      setFormError(err);
      return;
    }
    const pets = account.pets.some((p) => p.id === pet.id)
      ? account.pets.map((p) => (p.id === pet.id ? pet : p))
      : [...account.pets, pet];
    setMessage("반려동물 프로필을 저장했어요.");
    save({
      ...data,
      accounts: { ...data.accounts, [user]: { ...account, pets } },
    });
    close();
  }
  function bookingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const petId = String(f.get("pet"));
    const b: Booking = {
      id: crypto.randomUUID(),
      petId,
      petName: account.pets.find((p) => p.id === petId)?.name ?? "",
      serviceId: bookingService!,
      date: String(f.get("date")),
      time: String(f.get("time")),
      cancelled: false,
    };
    const err = validateBooking(account, b);
    if (err) {
      setFormError(err);
      return;
    }
    save({
      ...data,
      accounts: {
        ...data.accounts,
        [user]: { ...account, bookings: [b, ...account.bookings] },
      },
    });
    close();
    setPage("bookings");
    setMessage(
      "데모 예약이 완료됐어요. 실제 서비스가 신청되거나 결제되지 않습니다.",
    );
  }
  const serviceCards = (
    <div className="service-grid">
      {services
        .filter((s) => filter === "전체" || s.label === filter)
        .map((s) => (
          <article className="service-card" key={s.id}>
            <button
              className={`service-art ${s.color}`}
              onClick={() => setDetail(s.id)}
              aria-label={`${s.title} 상세 보기`}
            >
              <span className="art-orbit" />
              <span className="art-emoji">{s.icon}</span>
              <span className="art-caption">PAWDAY / {s.label}</span>
              <span className="round-arrow">
                <ArrowUpRight size={22} />
              </span>
            </button>
            <div className="service-body">
              <span className="eyebrow">
                {s.label} · {s.duration}
              </span>
              <h3>
                <button className="text-button" onClick={() => setDetail(s.id)}>
                  {s.title}
                </button>
              </h3>
              <p>{s.subtitle}</p>
              <div className="price-row">
                <strong>
                  {s.price.toLocaleString()}원 <small>/ 회</small>
                </strong>
                <button
                  className="text-link"
                  onClick={() => startBooking(s.id)}
                >
                  예약하기 <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
  return (
    <>
      <a href="#main" className="skip">
        본문으로 건너뛰기
      </a>
      <div className="demo-strip">
        작은 상상에서 시작하는 좋은 하루{" "}
        <span>가상 서비스 체험 · 실제 예약 및 결제 없음</span>
      </div>
      <header>
        <div className="nav-wrap">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("home");
            }}
          >
            <span className="brand-mark">
              <PawPrint size={23} />
            </span>
            포우데이<span className="brand-en">pawday</span>
          </a>
          <button
            className="menu-button"
            aria-label="메뉴 열기"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <nav className={mobile ? "open" : ""} aria-label="주 메뉴">
            {[
              ["home", "홈"],
              ["services", "서비스 찾기"],
              ["pets", "우리 아이"],
              ["bookings", "예약 내역"],
            ].map(([id, label]) => (
              <button
                aria-current={page === id ? "page" : undefined}
                className={page === id ? "active" : ""}
                key={id}
                onClick={() => navigate(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <label className="user-switch">
            <span className="avatar">{currentUser.name[0]}</span>
            <span className="sr-only">데모 사용자</span>
            <select
              aria-label="데모 사용자"
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                close();
                setMessage("데모 사용자를 전환했어요.");
              }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · 데모
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main id="main">
        {storageError && (
          <div className="notice error" role="alert">
            {storageError}{" "}
            <button onClick={() => setReset(true)}>저장 초기화</button>
          </div>
        )}
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        {page === "home" ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="pill">
                  <span /> 반려생활의 다정한 파트너
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  너의 하루가
                  <br />
                  조금 더 <em>행복하도록.</em>
                </h1>
                <p>
                  바쁜 하루에도, 마음은 늘 곁에.
                  <br />
                  돌봄부터 산책, 미용까지 포우데이와 함께해요.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary"
                    onClick={() => navigate("services")}
                  >
                    우리 아이에게 맞는 서비스 <ArrowUpRight size={19} />
                  </button>
                  <span>가벼운 마음으로 둘러보세요</span>
                </div>
                <div className="hero-trust">
                  <span>
                    <ShieldCheck size={17} /> 세심한 돌봄
                  </span>
                  <span>
                    <Heart size={17} /> 아이 중심의 시간
                  </span>
                </div>
              </div>
              <div
                className="hero-art"
                role="img"
                aria-label="햇살 아래 편안하게 앉아 있는 강아지 일러스트"
              >
                <div className="sun" />
                <span className="spark spark-one">✳</span>
                <span className="spark spark-two">✦</span>
                <div className="art-label">HAPPY PET, HAPPY DAY</div>
                <svg className="dog" viewBox="0 0 420 400" aria-hidden="true">
                  <ellipse cx="220" cy="350" rx="155" ry="26" fill="#acc3a0" />
                  <path
                    d="M284 291Q362 278 334 216Q310 184 316 251L277 263"
                    fill="#b87845"
                  />
                  <ellipse cx="214" cy="272" rx="94" ry="89" fill="#d6a16c" />
                  <path
                    d="M167 254Q159 207 202 210Q251 203 254 268L253 344H166Z"
                    fill="#f8e5c6"
                  />
                  <rect
                    x="129"
                    y="281"
                    width="49"
                    height="75"
                    rx="24"
                    fill="#d6a16c"
                  />
                  <rect
                    x="247"
                    y="281"
                    width="49"
                    height="75"
                    rx="24"
                    fill="#d6a16c"
                  />
                  <ellipse
                    cx="121"
                    cy="143"
                    rx="38"
                    ry="76"
                    transform="rotate(23 121 143)"
                    fill="#986038"
                  />
                  <ellipse
                    cx="293"
                    cy="143"
                    rx="38"
                    ry="76"
                    transform="rotate(-23 293 143)"
                    fill="#986038"
                  />
                  <path
                    d="M121 122Q124 44 207 46Q291 46 297 122L294 172Q287 237 210 240Q131 237 120 177Z"
                    fill="#dca972"
                  />
                  <path
                    d="M186 52Q214 43 234 55L243 146Q259 162 251 197Q210 236 170 197Q159 166 180 149Z"
                    fill="#fff0d7"
                  />
                  <ellipse cx="163" cy="143" rx="9" ry="12" fill="#343c30" />
                  <ellipse cx="251" cy="143" rx="9" ry="12" fill="#343c30" />
                  <circle cx="165" cy="140" r="3" fill="white" />
                  <circle cx="253" cy="140" r="3" fill="white" />
                  <path
                    d="M194 170Q209 161 225 170Q224 184 209 186Q195 184 194 170"
                    fill="#343c30"
                  />
                  <path
                    d="M189 196Q209 215 230 195"
                    stroke="#604332"
                    stroke-width="4"
                    fill="none"
                    stroke-linecap="round"
                  />
                  <path d="M201 205Q211 231 221 203" fill="#da857a" />
                  <path
                    d="M145 222Q207 253 274 222L272 242Q207 270 146 242"
                    fill="#35664b"
                  />
                  <circle cx="211" cy="253" r="11" fill="#f5cc6d" />
                </svg>
                <div className="floating-note">
                  <span>♡</span>
                  <div>
                    오늘도, 꼬리 흔드는 하루<small>포우데이가 함께할게요</small>
                  </div>
                </div>
                <div className="art-stamp">
                  with love
                  <br />
                  <PawPrint size={23} /> pawday
                </div>
              </div>
            </section>
            <section className="benefits" aria-label="서비스 가치">
              <div>
                <Heart />
                <span>
                  <strong>마음을 먼저 살펴요</strong>
                  <small>아이의 성향과 속도에 맞춰</small>
                </span>
              </div>
              <div>
                <ShieldCheck />
                <span>
                  <strong>작은 순간까지 세심하게</strong>
                  <small>보호자의 마음으로 함께해요</small>
                </span>
              </div>
              <div>
                <CalendarDays />
                <span>
                  <strong>일상에 맞춘 간편한 예약</strong>
                  <small>필요한 날, 필요한 서비스</small>
                </span>
              </div>
            </section>
            <section className="section">
              <div className="section-top">
                <div>
                  <span className="eyebrow">OUR SERVICES</span>
                  <h2>어떤 하루를 선물할까요?</h2>
                  <p>우리 아이에게 꼭 맞는 시간을 찾아보세요.</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => navigate("services")}
                >
                  서비스 전체 보기 <ArrowUpRight size={18} />
                </button>
              </div>
              {serviceCards}
              <p className="fine-print">
                서비스와 금액은 가상 예시입니다. 실제 제공 업체 및 예약 가능
                여부와 관련이 없습니다.
              </p>
            </section>
            <section className="bottom-banner">
              <div>
                <span className="eyebrow">A LITTLE MORE ABOUT YOUR FRIEND</span>
                <h2>우리 아이 이야기를 들려주세요.</h2>
                <p>좋아하는 것부터 작은 습관까지, 더 다정한 하루의 시작.</p>
              </div>
              <button className="primary" onClick={() => navigate("pets")}>
                프로필 등록하기 <Plus size={18} />
              </button>
            </section>
          </>
        ) : (
          <section className="section workspace">
            <div className="section-top">
              <div>
                <span className="eyebrow">
                  {page === "services"
                    ? "FIND YOUR MOMENT"
                    : page === "pets"
                      ? "MY LITTLE FRIENDS"
                      : "OUR NEXT DAY"}
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  {page === "services"
                    ? "함께할 서비스를 찾아요"
                    : page === "pets"
                      ? "우리 아이 프로필"
                      : "예약한 하루"}
                </h1>
                <p>
                  {page === "services"
                    ? "돌봄, 산책, 미용. 필요한 순간에 함께해요."
                    : `${currentUser.name}님의 데모 공간이에요. 실제 개인정보는 입력하지 마세요.`}
                </p>
              </div>
              {page === "pets" && (
                <button
                  className="primary"
                  onClick={() => {
                    setFormError("");
                    setPetEdit({
                      id: crypto.randomUUID(),
                      name: "",
                      kind: "강아지",
                      age: "",
                      note: "",
                    });
                  }}
                >
                  <Plus size={18} /> 새 프로필
                </button>
              )}
            </div>
            {page === "services" && (
              <>
                <div className="filters" aria-label="서비스 종류">
                  {["전체", "돌봄", "산책", "미용"].map((f) => (
                    <button
                      key={f}
                      aria-pressed={f === filter}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {serviceCards}
                <p className="fine-print">
                  모든 서비스와 금액은 가상 예시입니다. 산책은 반려견 대상
                  예시이며, 데모에서는 모든 프로필로 예약 흐름을 체험할 수
                  있습니다.
                </p>
              </>
            )}
            {page === "pets" &&
              (account.pets.length ? (
                <div className="pet-grid">
                  {account.pets.map((p) => (
                    <article className="pet-card" key={p.id}>
                      <span className="pet-avatar">
                        {p.kind === "고양이" ? "🐈" : "🐕"}
                      </span>
                      <span className="pill">나의 작은 가족</span>
                      <h2>{p.name}</h2>
                      <p>
                        {p.kind} · {p.age}살
                      </p>
                      <p className="pet-note">
                        {p.note || "아직 적어 둔 메모가 없어요."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => {
                          setFormError("");
                          setPetEdit(p);
                        }}
                      >
                        {p.name} 프로필 수정
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <PawPrint size={42} />
                  <h2>아직 등록된 아이가 없어요</h2>
                  <p>가상의 이름으로 첫 프로필을 만들어 보세요.</p>
                  <button
                    className="primary"
                    onClick={() =>
                      setPetEdit({
                        id: crypto.randomUUID(),
                        name: "",
                        kind: "강아지",
                        age: "",
                        note: "",
                      })
                    }
                  >
                    프로필 등록하기
                  </button>
                </div>
              ))}
            {page === "bookings" &&
              (account.bookings.length ? (
                <div className="bookings">
                  {account.bookings.map((b) => {
                    const s = services.find((s) => s.id === b.serviceId)!;
                    return (
                      <article
                        className={`booking-card ${b.cancelled ? "cancelled" : ""}`}
                        key={b.id}
                      >
                        <span className={`booking-icon ${s.color}`}>
                          {s.icon}
                        </span>
                        <div>
                          <span
                            className={`status ${b.cancelled ? "muted" : ""}`}
                          >
                            {b.cancelled ? "취소 완료" : "데모 예약 완료"}
                          </span>
                          <h2>{s.title}</h2>
                          <p>
                            {b.petName} · {b.date} · {b.time} · {s.duration}
                          </p>
                          <small>가상 서비스 · 결제 없음</small>
                        </div>
                        <div className="booking-end">
                          <strong>{s.price.toLocaleString()}원</strong>
                          {!b.cancelled && (
                            <button
                              className="secondary"
                              onClick={() => setCancel(b)}
                            >
                              예약 취소
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <CalendarDays size={42} />
                  <h2>아직 예약한 하루가 없어요</h2>
                  <p>우리 아이에게 즐거운 시간을 선물해 볼까요?</p>
                  <button
                    className="primary"
                    onClick={() => navigate("services")}
                  >
                    서비스 둘러보기
                  </button>
                </div>
              ))}
          </section>
        )}
      </main>
      <footer>
        <div className="footer-top">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("home");
            }}
          >
            <PawPrint size={23} /> 포우데이
          </a>
          <p>너와 나의, 더 좋은 하루.</p>
          <span>
            <MapPin size={15} /> 가상의 우리 동네
          </span>
        </div>
        <div className="footer-bottom">
          <p>
            © 2026 PAWDAY. 가상 브랜드 데모.
            <br />
            실제 로그인·서버 DB·결제는 제공하지 않습니다. 데이터는 이
            브라우저에만 저장됩니다.
          </p>
          <button className="text-link" onClick={() => setReset(true)}>
            데모 데이터 초기화
          </button>
        </div>
      </footer>
      <dialog
        ref={dialog}
        onKeyDown={trapDialogFocus}
        onCancel={close}
        aria-labelledby="dialog-title"
      >
        <button className="close" onClick={close} aria-label="닫기">
          <X />
        </button>
        {detail &&
          (() => {
            const s = services.find((s) => s.id === detail)!;
            return (
              <>
                <div className={`detail-art ${s.color}`}>{s.icon}</div>
                <span className="eyebrow">
                  {s.label} · {s.duration} · 가상 서비스
                </span>
                <h2 id="dialog-title">{s.title}</h2>
                <p>{s.description}</p>
                <ul className="includes">
                  {s.included.map((t) => (
                    <li key={t}>
                      <Check size={18} />
                      {t}
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>{s.price.toLocaleString()}원</strong> / 회 · 예시 금액
                </p>
                <button
                  className="primary full"
                  onClick={() => startBooking(s.id)}
                >
                  이 서비스 예약하기 <ArrowRight size={18} />
                </button>
              </>
            );
          })()}
        {petEdit && (
          <form onSubmit={petSubmit}>
            <span className="eyebrow">MY PET · DEMO</span>
            <h2 id="dialog-title">
              반려동물 프로필{" "}
              {account.pets.some((p) => p.id === petEdit.id) ? "수정" : "등록"}
            </h2>
            <p>가상의 정보만 입력해 주세요.</p>
            <label>
              이름
              <input
                name="name"
                required
                maxLength={20}
                defaultValue={petEdit.name}
                placeholder="예: 보미"
                autoFocus
              />
            </label>
            <div className="form-row">
              <label>
                종류
                <select
                  aria-label="종류"
                  name="kind"
                  defaultValue={petEdit.kind}
                >
                  <option>강아지</option>
                  <option>고양이</option>
                  <option>기타</option>
                </select>
              </label>
              <label>
                나이 (살)
                <input
                  name="age"
                  type="number"
                  required
                  min="0"
                  max="40"
                  step="1"
                  defaultValue={petEdit.age}
                />
              </label>
            </div>
            <label>
              알아두면 좋은 점 (선택)
              <textarea
                name="note"
                maxLength={200}
                defaultValue={petEdit.note}
                placeholder="좋아하는 놀이, 작은 습관 등을 적어 주세요."
              />
            </label>
            {formError && (
              <p role="alert" className="error">
                {formError}
              </p>
            )}
            <button className="primary full">프로필 저장</button>
          </form>
        )}
        {bookingService && (
          <form onSubmit={bookingSubmit}>
            <span className="eyebrow">MAKE A HAPPY DAY</span>
            <h2 id="dialog-title">데모 예약하기</h2>
            <p>
              {services.find((s) => s.id === bookingService)!.title} ·{" "}
              {services
                .find((s) => s.id === bookingService)!
                .price.toLocaleString()}
              원 (가상 금액)
            </p>
            {account.pets.length ? (
              <>
                <label>
                  함께할 반려동물
                  <select aria-label="함께할 반려동물" name="pet">
                    {account.pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-row">
                  <label>
                    날짜
                    <input name="date" type="date" min={today()} required />
                  </label>
                  <label>
                    시간
                    <select aria-label="시간" name="time">
                      <option>10:00</option>
                      <option>13:00</option>
                      <option>16:00</option>
                    </select>
                  </label>
                </div>
                <p className="fine-print">
                  한 아이당 하루 한 번 예약할 수 있어요. 실제 예약·결제·서비스
                  제공은 이루어지지 않습니다.
                </p>
                {formError && (
                  <p className="error" role="alert">
                    {formError}
                  </p>
                )}
                <button className="primary full">데모 예약 확정</button>
              </>
            ) : (
              <>
                <p className="notice">예약 전에 반려동물 프로필이 필요해요.</p>
                <button
                  type="button"
                  className="primary full"
                  onClick={() => {
                    close();
                    navigate("pets");
                    setPetEdit({
                      id: crypto.randomUUID(),
                      name: "",
                      kind: "강아지",
                      age: "",
                      note: "",
                    });
                  }}
                >
                  프로필 등록하기
                </button>
              </>
            )}
          </form>
        )}
        {cancel && (
          <>
            <h2 id="dialog-title">예약을 취소할까요?</h2>
            <p>
              {cancel.petName} · {cancel.date} · {cancel.time}
            </p>
            <p>취소한 데모 예약은 내역에 남아요. 취소 수수료는 없습니다.</p>
            <div className="form-row">
              <button className="secondary" onClick={close}>
                예약 유지
              </button>
              <button
                className="primary"
                onClick={() => {
                  save({
                    ...data,
                    accounts: {
                      ...data.accounts,
                      [user]: {
                        ...account,
                        bookings: account.bookings.map((b) =>
                          b.id === cancel.id ? { ...b, cancelled: true } : b,
                        ),
                      },
                    },
                  });
                  close();
                  setMessage("데모 예약이 취소됐어요.");
                }}
              >
                취소 확정
              </button>
            </div>
          </>
        )}
        {reset && (
          <>
            <h2 id="dialog-title">데모 데이터를 초기화할까요?</h2>
            <p>두 데모 사용자의 프로필과 예약을 모두 처음 상태로 되돌립니다.</p>
            <div className="form-row">
              <button className="secondary" onClick={close}>
                돌아가기
              </button>
              <button
                className="primary"
                onClick={() => {
                  try {
                    localStorage.removeItem(storageKey);
                    setData(seed());
                    setStorageError("");
                    setMessage("데모 데이터를 초기화했어요.");
                  } catch {
                    setStorageError(
                      "저장소 초기화가 차단됐어요. 브라우저 저장 설정을 확인해 주세요.",
                    );
                  }
                  close();
                }}
              >
                초기화 확정
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
