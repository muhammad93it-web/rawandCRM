import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, UserRound } from "lucide-react";
import { useSessionLogin } from "@workspace/api-client-react";
import hero from "@/assets/login-hero.png";

type Language = "en" | "ar" | "ku";
const copy = {
  en: { heading:"Login", helper:"Enter Username and Password to Login", username:"Username", password:"Password", submit:"Login", pending:"Logging in…", language:"Language", required:"Enter your username and password", failed:"Incorrect username or password" },
  ar: { heading:"تسجيل الدخول", helper:"أدخل اسم المستخدم وكلمة المرور لتسجيل الدخول", username:"اسم المستخدم", password:"كلمة المرور", submit:"تسجيل الدخول", pending:"جارٍ تسجيل الدخول…", language:"اللغة", required:"أدخل اسم المستخدم وكلمة المرور", failed:"اسم المستخدم أو كلمة المرور غير صحيحة" },
  ku: { heading:"چوونەژوورەوە", helper:"ناوی بەکارهێنەر و وشەی نهێنی بنووسە بۆ چوونەژوورەوە", username:"ناوی بەکارهێنەر", password:"وشەی نهێنی", submit:"چوونەژوورەوە", pending:"لە چوونەژوورەوەدایە…", language:"زمان", required:"تکایە ناوی بەکارهێنەر و وشەی نهێنی پڕبکەرەوە", failed:"ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە" },
} as const;

export default function Login() {
  const [,setLocation]=useLocation(),login=useSessionLogin();
  const [language,setLanguageState]=useState<Language>(() => {
    const saved=localStorage.getItem("rawand-login-language");
    return saved==="ar"||saved==="ku"||saved==="en"?saved:"en";
  });
  const [username,setUsername]=useState(""),[password,setPassword]=useState(""),[showPassword,setShowPassword]=useState(false),[error,setError]=useState("");
  const text=copy[language],rtl=language!=="en";
  const setLanguage=(next:Language)=>{setLanguageState(next);localStorage.setItem("rawand-login-language",next)};
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setError("");
    if(!username||!password){setError(text.required);return}
    login.mutate({data:{username,password}},{onSuccess:()=>setLocation("/"),onError:()=>setError(text.failed)});
  };
  return <main className="login-page">
    <div className="login-card">
      <div className="login-hero"><img src={hero} alt=""/></div>
      <section className="login-panel" dir={rtl?"rtl":"ltr"}>
        <header className="login-brand" dir="ltr"><span>R</span><h1>Rawand Decoration CRM</h1></header>
        <h2>{text.heading}</h2><p>{text.helper}</p>
        <form onSubmit={submit}>
          <label className="login-field"><span className="sr-only">{text.username}</span><span className="login-input"><input aria-label={text.username} autoComplete="username" value={username} onChange={event=>setUsername(event.target.value)} disabled={login.isPending}/><UserRound/></span></label>
          <label className="login-field"><span className="sr-only">{text.password}</span><span className="login-input"><input aria-label={text.password} type={showPassword?"text":"password"} autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} disabled={login.isPending}/><button type="button" aria-label="Toggle password visibility" onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff/>:<Eye/>}</button></span></label>
          <button className="login-submit" type="submit" disabled={login.isPending}>{login.isPending?text.pending:text.submit}</button>
          {error&&<div role="alert" className="login-error">{error}</div>}
        </form>
        <strong className="login-language-label">{text.language}</strong>
        <div className="login-languages" dir="ltr">{([["en","English"],["ar","عربي"],["ku","کوردی"]] as const).map(([code,label])=><button key={code} className={language===code?"active":""} onClick={()=>setLanguage(code)}>{label}</button>)}</div>
      </section>
    </div>
  </main>;
}