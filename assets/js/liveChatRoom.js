// Initialize Firebase
var config = {
    apiKey: "AIzaSyATcNjuxgzoTyTCGLJvxNyHJHZEvh0a2d8",
    authDomain: "vuechatroom-d43a7.firebaseapp.com",
    databaseURL: "https://vuechatroom-d43a7.firebaseio.com",
    projectId: "vuechatroom-d43a7",
    storageBucket: "vuechatroom-d43a7.appspot.com",
    messagingSenderId: "317785143753"
};
firebase.initializeApp(config);

const msgRef = firebase.database().ref('/messages/');
const storageRef = firebase.storage().ref('/images/');


// important Component template
Vue.component('chat-component', {
    template: '#chat-component-template'
});

var app = new Vue({
    el: '#app',
    data: {
        userNameSet: false, // 姓名輸入框
        userName: '', // 名稱
        messages: [], // 訊息內容
        upload: false, // 上傳進度框
        progress: '', // 上傳進度%數
        chatClass: '',
        isChecked: true,
        CheckedClass: 'ext'
    },
    firebase: {
        msgDB: msgRef
    },
    // computed: {

    // },
    methods: {
        CheckedBtn() {
            if (this.isChecked == false) {
                this.CheckedClass = 'ext'
            } else {
                this.CheckedClass = 'int'
            }
        },
        /** 彈出設定視窗 */
        ////setName() {
        ////	const vm = this;
        ////	vm.userNameSet = true;
        ////},
        /** 儲存設定名稱 */
        saveName() {
            // vue的mtthod中this是指export中這整塊的資料
            const vm = this;
            const userName = document.querySelector('#js-userName').value;
            if (userName.trim() == '') { return; }
            // 這裡的vm.userName(this.userName)就是data()裡面的userName
            vm.userName = userName;
            vm.userNameSet = false;
        },
        /** 取得時間 */
        getTime() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            return `${(hours >= 12) ? "下午" : "上午"} ${hours}:${(minutes < 10) ? '0' + minutes : minutes}`;
        },
        /** 傳送訊息 */
        sendMessage(e) {
            const vm = this;
            const userName = document.querySelector('#js-userName');
            let message = document.querySelector('#js-message');
            // 如果是按住shift則不傳送訊息(多行輸入)
            if (e.shiftKey) {
                return false;
            }
            // 如果輸入是空則不傳送訊息
            if (message.value.length <= 1 && message.value.trim() == '') {
                // 避免enter產生的空白換行
                e.preventDefault();
                return false;
            }
            // 對firebase的db做push，db只能接受json物件格式，若要用陣列要先轉字串來存
            msgRef.push({
                userName: userName.value,
                type: 'text',
                chatClass: this.CheckedClass,
                message: message.value,
                // 取得時間，這裡的vm.getTime()就是method中的getTime
                timeStamp: vm.getTime()
            })
            // 清空輸入欄位並避免enter產生的空白換行
            message.value = '';
            e.preventDefault();
        },
        /** 傳送圖片 */
        sendImage(e) {
            const vm = this;
            const userName = document.querySelector('#js-userName');
            // 取得上傳檔案的資料
            const file = e.target.files[0];
            const fileName = Math.floor(Date.now() / 1000) + `_${file.name}`;
            const metadata = {
                contentType: 'image/*'
            };
            // 取得HTML進度條元素
            let progressBar = document.querySelector('#js-progressBar');
            // 上傳資訊設定
            const uploadTask = storageRef.child(fileName).put(file, metadata);
            // 上傳狀態處理
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
                /* 上傳進度 */
                function (snapshot) {
                    let progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    if (progress < 100) {
                        // 開啟進度條
                        vm.upload = true;
                        vm.progress = `${progress}%`;
                        progressBar.setAttribute('style', `width:${progress}%`);
                    }
                },
                /* 錯誤處理 */
                function (error) {
                    msgRef.child('bug/').push({
                        userName: userName.value,
                        type: 'image',
                        message: error.code,
                        timeStamp: vm.getTime()
                    })
                },
                /* 上傳結束處理 */
                function () {
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    msgRef.push({
                        userName: userName.value,
                        type: 'image',
                        chatClass: vm.CheckedClass,
                        message: downloadURL,
                        timeStamp: vm.getTime()
                    })
                    // 關閉進度條
                    vm.upload = false;
                });
        },
        removeThisMsg: function (e) {
            msgRef.child(e['.key']).remove();
            //toastr.error('Remove this item')
        },
        /** 顯示更多 */
        readMore(e) {
            // 把內容高度限制取消
            e.target.previousElementSibling.setAttribute('style', 'max-height: 100%;')
            // 隱藏"顯示更多"按紐
            e.target.setAttribute('style', 'display: none;');
        }
    },
    // mounted是vue的生命週期之一，代表模板已編譯完成，已經取值準備渲染元件了
    mounted() {
        const vm = this;
        msgRef.on('value', function (snapshot) {
            const val = snapshot.val();
            vm.messages = val;
        })
    },
    // update是vue的生命週期之一，在元件渲染完成後執行
    updated() {
        // 判斷內容高度超過250就隱藏起來，把"顯示更多"按紐打開
        //const msgHeight = document.querySelectorAll('.txtHeight');
        $(".txtHeight").each(function () {
            var maxHeight = "250";
            if ($(this).height() >= maxHeight) {
                $(this).next().attr('style', 'display: block');
            }
        });
        //// msgHeight.forEach((message) => {
        //// 	if (message.offsetHeight > 250) {
        //// 		message.querySelector('.msgReadMore').setAttribute('style', 'display: block');
        //// 	}
        //// })
        // 當畫面渲染完成，把聊天視窗滾到最底部(讀取最新消息)
        ////const roomBody = document.querySelector('#js-roomBody');
        ////roomBody.scrollTop = roomBody.scrollHeight;

        var window_height = $(window).height();
        var document_height = $(document).height();
        $('html,body').animate({ scrollTop: window_height + document_height }, 1000);
    }
});