// import './style.css'
// import javascriptLogo from './javascript.svg'
// import viteLogo from '/vite.svg'
// import { setupCounter } from './counter.js'
//
// document.querySelector('#app').innerHTML = `
//   <div>
//     <a href="https://vite.dev" target="_blank">
//       <img assets="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
//       <img assets="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
//     </a>
//     <h1>Hello Vite!</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite logo to learn more
//     </p>
//   </div>
// `
//
// setupCounter(document.querySelector('#counter'))
import { db } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// دالة لتوليد 4 أرقام عشوائية
function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.querySelector("input[type='email']");
    const countrySelect = document.getElementById("country");
    const codeSelect = document.getElementById("code");
    const phoneInput = document.querySelector("input[type='number']");
    const nextBtn = document.querySelector("button");

    const countryCodes = {
        ye: "+967",
        sa: "+966",
        eg: "+20",
        us: "+1",
        uk: "+44"
    };

    countrySelect.addEventListener("change", () => {
        const country = countrySelect.value;
        codeSelect.innerHTML = "";
        if (country && countryCodes[country]) {
            const option = document.createElement("option");
            option.value = countryCodes[country];
            option.textContent = countryCodes[country];
            codeSelect.appendChild(option);
        }
    });

    nextBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        const country = countrySelect.value;
        const code = codeSelect.value;
        const phone = phoneInput.value.trim();

        if (!email || !country || !code || !phone) {
            alert("من فضلك أدخل كل البيانات");
            return;
        }

        const msgDiv = document.getElementById("message");
        const overlay = document.getElementById("overlay");
        const login = document.getElementById("login");
        const verifying = document.getElementById("verifying");

        overlay.classList.remove("hidden");
        msgDiv.classList.remove("opacity-0");
        msgDiv.classList.add("opacity-100");

        try {
            const verificationCode = generateCode();

            await addDoc(collection(db, "users"), {
                email,
                country,
                code,
                phone,
                verificationCode,
                isVerified: false,
                createdAt: new Date()
            });

            sendVerificationEmail(email, verificationCode);

        } catch (e) {
            console.error("❌ خطأ أثناء الحفظ:", e);
            alert("حصل خطأ أثناء الحفظ 😢");
        } finally {
            // 🔹 إخفاء الخلفية + الأيقونة
            msgDiv.classList.remove("opacity-100");
            msgDiv.classList.add("opacity-0");
            overlay.classList.add("hidden");

            login.classList.add("hidden");

            verifying.classList.remove("hidden", "opacity-0");
            verifying.classList.add("opacity-100", "transition-opacity", "duration-500");

            function maskEmail(email) {
                const [name, domain] = email.split("@");
                const maskedName = name.slice(0, 2) + "******";
                return maskedName + "@" + domain;
            }

            document.getElementById("messageemail").textContent =
                maskEmail(email) + " تم إرسال الرمز إلى ";
        }
    });

    function sendVerificationEmail(email, code) {
        emailjs.send("service_003idgu", "template_wgap7m6", {
            to_email: email,
            message: `رمز التفعيل الخاص بك هو: ${code}`
        }).then(() => {
            console.log("📩 تم إرسال الإيميل بنجاح");
        }).catch((err) => {
            console.error("خطأ في إرسال الإيميل:", err);
        });
    }

    document.getElementById("back-to-login").addEventListener("click", () => {
        const login = document.getElementById("login");
        const verifying = document.getElementById("verifying");

        verifying.classList.add("hidden");

        login.classList.remove("hidden");

    });

    document.getElementById("otp-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        // 🟢 إظهار التحميل
        document.getElementById("overlay").classList.remove("hidden");
        const msgDiv = document.getElementById("message");
        msgDiv.classList.remove("opacity-0");
        msgDiv.classList.add("opacity-100");

        const otpInputs = document.querySelectorAll(".otp-input");
        let enteredCode = "";
        otpInputs.forEach(input => enteredCode += input.value.trim());

        const email = emailInput.value.trim();  // ← متغيرك الأصلي

        if (enteredCode.length < 4) {
            // ❌ إخفاء التحميل عند الخطأ
            document.getElementById("overlay").classList.add("hidden");
            msgDiv.classList.remove("opacity-100");
            msgDiv.classList.add("opacity-0");

            alert("من فضلك أدخل جميع أرقام OTP");
            return;
        }

        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // ❌ إخفاء التحميل عند الخطأ
                document.getElementById("overlay").classList.add("hidden");
                msgDiv.classList.remove("opacity-100");
                msgDiv.classList.add("opacity-0");

                alert("❌ البريد غير موجود في النظام");
                return;
            }

            let isValid = false;
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.verificationCode === enteredCode) {
                    isValid = true;

                    // تحديث حالة التحقق
                    updateDoc(doc(db, "users", docSnap.id), { isVerified: true });
                }
            });

            // ✅ إخفاء التحميل بعد الانتهاء
            document.getElementById("overlay").classList.add("hidden");
            msgDiv.classList.remove("opacity-100");
            msgDiv.classList.add("opacity-0");

            if (isValid) {
                // 🟢 حفظ الإيميل في localStorage بعد التحقق
                localStorage.setItem("verifiedEmail", email);

                // ✅ إخفاء شاشة التحقق OTP
                document.getElementById("verifying").classList.add("hidden");

                // ✅ إظهار شاشة البروفايل
                const profileDiv = document.getElementById("Profile");
                profileDiv.classList.remove("hidden");
                profileDiv.classList.remove("opacity-0");
                profileDiv.classList.add("opacity-100");
            } else {
                alert("❌ الرمز غير صحيح، حاول مرة أخرى");
            }

        } catch (err) {
            document.getElementById("overlay").classList.add("hidden");
            msgDiv.classList.remove("opacity-100");
            msgDiv.classList.add("opacity-0");

            console.error("خطأ أثناء التحقق:", err);
            alert("❌ حدث خطأ أثناء التحقق");
        }
    });

});
document.querySelectorAll(".otp-input").forEach((input, index, inputs) => {
    input.addEventListener("input", (e) => {
        if (e.target.value.length > 1) {
            e.target.value = e.target.value.slice(0, 1);
        }
        if (e.target.value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

window.addEventListener("load", () => {
    setTimeout(() => {
        ["title", "from", "almggaly"].forEach(id => {
            const el = document.getElementById(id);
            el.classList.replace("opacity-0", "opacity-100");
        });

        const logo = document.getElementById("logo");
        logo.classList.replace("w-20", "w-15");
        logo.classList.remove("md:w-28");
        logo.classList.add("pb-5");

        setTimeout(() => {
            const from = document.getElementById("from");
            const icon = document.getElementById("loadingIcon");
            const almggaly = document.getElementById("almggaly");

            from.classList.add("opacity-0", "opacity-100"); // يختفي بسلاسة
            setTimeout(() => from.classList.add("hidden",), 0); // يخفيه نهائي بعد الانتقال

            icon.classList.remove("hidden");
            setTimeout(() => {
                icon.classList.replace("opacity-0", "opacity-100");
            }, 100);

            almggaly.textContent = "Loading...";
            almggaly.classList.add("text-[#0CCC83]");

            setTimeout(() => {
                const header = document.getElementById("header");
                const nextDiv = document.getElementById("sic");

                header.classList.add("opacity-0", "transition-opacity", "duration-700");

                setTimeout(() => {
                    header.classList.add("hidden");
                    nextDiv.classList.remove("hidden");
                    nextDiv.classList.add("opacity-0", "transition-opacity", "duration-700");

                    setTimeout(() => {
                        nextDiv.classList.replace("opacity-0", "opacity-100");
                    }, 50);
                }, 700);
            }, 2000);
        }, 1600);

    }, 1600);
});
document.getElementById("continueBtn").addEventListener("click", function (e) {
    e.preventDefault();

    const sic = document.getElementById("sic");
    const login = document.getElementById("login");

    // اخفاء sic بسلاسة
    sic.classList.replace("opacity-100", "opacity-0");
    setTimeout(() => {
        sic.classList.add("hidden");

        login.classList.remove("hidden");
        setTimeout(() => {
            login.classList.replace("opacity-0", "opacity-100");
        }, 50);
    }, 700);
});
document.addEventListener("DOMContentLoaded", () => {
    const imageUpload = document.getElementById("imageUpload");
    const profileImage = document.getElementById("profileImage");
    const defaultIcon = document.getElementById("defaultIcon");

    imageUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImage.src = e.target.result;
                profileImage.classList.remove("hidden");
                defaultIcon.classList.add("hidden");
            };
            reader.readAsDataURL(file);
        }
    });
});
// عناصر واجهة بروفايل
const profileNextBtn = document.querySelector("#Profile button[type='submit']");
const nameInput = document.querySelector("#Profile input[type='text']");
const imageInput = document.getElementById("imageUpload");
const profileImg = document.getElementById("profileImage");
const defaultIcon = document.getElementById("defaultIcon");

// عند رفع صورة
imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            profileImg.src = event.target.result;
            profileImg.classList.remove("hidden");
            defaultIcon.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
});

// حفظ البروفايل
profileNextBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const fullName = nameInput.value.trim();
    if (!fullName) {
        alert("من فضلك أدخل الاسم الشخصي");
        return;
    }

    // إذا فيه صورة مرفوعة
    let profileImageUrl = null;
    if (profileImg && !profileImg.classList.contains("hidden")) {
        profileImageUrl = profileImg.src; // ⚠️ يفضل رفعه Firebase Storage
    }

    try {
        // 🟢 إظهار التحميل
        document.getElementById("overlay").classList.remove("hidden");
        const msgDiv = document.getElementById("message");
        msgDiv.classList.remove("opacity-0");
        msgDiv.classList.add("opacity-100");

        // 📌 الإيميل اللي تحققنا منه
        const email = localStorage.getItem("verifiedEmail");
        if (!email) {
            document.getElementById("overlay").classList.add("hidden");
            msgDiv.classList.remove("opacity-100");
            msgDiv.classList.add("opacity-0");

            alert("❌ لم يتم العثور على البريد الإلكتروني المتحقق منه");
            return;
        }

        // 🔎 نبحث عن المستخدم بنفس الإيميل
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            for (const docSnap of querySnapshot.docs) {
                await updateDoc(doc(db, "users", docSnap.id), {
                    name: fullName,
                    profileImage: profileImageUrl || null,
                });

                // بعد التحديث، نبني البيانات لتخزينها محليًا
                const userData = {
                    id: docSnap.id,
                    email: email,
                    name: fullName,
                    profileImage: profileImageUrl || null,
                };

                // 🟢 تخزين بيانات المستخدم في localStorage
                localStorage.setItem("user", JSON.stringify(userData));
            }

            // ✅ بعد الحفظ ننتقل إلى الصفحة التالية
            window.location.href = "/chat/chat.html";
        } else {
            document.getElementById("overlay").classList.add("hidden");
            msgDiv.classList.remove("opacity-100");
            msgDiv.classList.add("opacity-0");

            alert("❌ لم يتم العثور على مستخدم بهذا البريد");
        }
    } catch (err) {
        document.getElementById("overlay").classList.add("hidden");
        const msgDiv = document.getElementById("message");
        msgDiv.classList.remove("opacity-100");
        msgDiv.classList.add("opacity-0");

        console.error("❌ خطأ أثناء تحديث البروفايل:", err);
        alert("حصل خطأ أثناء حفظ البروفايل 😢");
    }
});




