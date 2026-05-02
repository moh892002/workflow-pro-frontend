import React, { useState } from "react";
import { database } from "../firebase";
import { ref, set, get } from "firebase/database";

const TestDB = () => {
  const [message, setMessage] = useState("");

  const testWrite = async () => {
    try {
      await set(ref(database, "test"), {
        message: "مرحباً من React!",
        time: new Date().toISOString(),
      });
      setMessage(" تم الكتابة بنجاح!");
    } catch (error: any) {
      setMessage(" خطأ: " + error.message);
    }
  };

  const testRead = async () => {
    try {
      const snapshot = await get(ref(database, "test"));
      const data = snapshot.val();
      setMessage("📖 البيانات: " + JSON.stringify(data));
    } catch (error: any) {
      setMessage(" خطأ في القراءة: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔧 اختبار قاعدة البيانات</h2>
      <button onClick={testWrite}>اختبار الكتابة</button>
      <button onClick={testRead} style={{ marginLeft: "10px" }}>
        اختبار القراءة
      </button>
      {message && <div style={{ marginTop: "20px" }}>{message}</div>}
    </div>
  );
};

export default TestDB;
