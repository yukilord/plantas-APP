(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyBgevaHRxwBMDAjKLSTwsHaTAt0ZtfweXg",
        authDomain: "appflor-cb81f.firebaseapp.com",
        projectId: "appflor-cb81f",
        storageBucket: "appflor-cb81f.firebasestorage.app",
        messagingSenderId: "996802654442",
        appId: "1:996802654442:web:82b88bfb3c98c0ae3ae793",
        measurementId: "G-W09T1JP33L"
    };

    firebase.initializeApp(firebaseConfig);
    window.firebaseServices = {
        auth: firebase.auth(),
        db: firebase.firestore(),
        storage: firebase.storage()
    };
})();
