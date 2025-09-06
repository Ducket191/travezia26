import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [Name, setName] = useState('');
  const [Phonenumber, setPhonenumber] = useState('');
  const [Email, setEmail] = useState('');
  const [selectedTickets, setSelectedTickets] = useState(null);
  const [SeatCount, setSeatCount] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [stage, setStage] = useState(-1);
  const seats = [];

  const rows = ["A","B","C","D","E","F","G","H","I"];
  rows.forEach(row => {
    for (let i = 1; i <= 30; i++) {  // adjust max number per row
      seats.push(`${row}${i}`);
    }
  });


  for (let i = 1; i <= 100; i++) {
    seats.push(`S${i}`);
  }


  const handleNameChange = (event) => setName(event.target.value);
  const handlePhonenumberChange = (event) => setPhonenumber(event.target.value);
  const handleEmailChange = (event) => setEmail(event.target.value);

  const handleSelection = (value) => {
    setSelectedTickets(value);
    setSeatCount(value);
    setSelectedSeats([]); // reset seat selection
  };

  const handleSeatChosen = (seat) => {
    const isSelected = selectedSeats.includes(seat);

    if (!isSelected) {
      if (selectedSeats.length < SeatCount) {
        setSelectedSeats([...selectedSeats, seat]);
      } else {
        alert("Đã chọn đủ chỗ ngồi!");
      }
    } else {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (selectedTickets != null) {
      console.log('Submitted:', { Name, Phonenumber, Email, selectedTickets });
      nextStage();
    } else {
      alert('Bạn phải chọn số lượng vé');
    }
  };

  const nextStage = () => setStage(stage + 1);
  const backStage = () => setStage(stage - 1);

  const handleAdd = () => {
    axios.post('http://localhost:3000/Infor/add', {
      name: Name,
      phone: Phonenumber,
      email: Email,
      ticketCount: selectedTickets,
    })
    .then((result) => {
      console.log('Submission successful:', result.data);
      alert('Thông tin đã được gửi thành công!');
    })
    .catch((err) => {
      console.error('Error submitting data:', err);
      alert('Đã xảy ra lỗi khi gửi thông tin. Vui lòng thử lại sau ít phút.');
    });
    nextStage();
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://trave26.onrender.com/send-alertemail', {
        name: Name,
        email: Email,
        phonenumber: Phonenumber,
        ticketCount: selectedTickets,
      });

      if (response.status === 200) {
        nextStage();
      } else {
        alert('Đã xảy ra lỗi khi gửi email. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Đã xảy ra lỗi khi gửi email. Vui lòng thử lại.');
    }
  };


const handlePayment = async () => {

  try {
    const response = await fetch('https://trave26.onrender.com/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: selectedTickets * 10000,
        orderCode: Date.now(),
        email: Email,
        name: Name,
        phonenumber: Phonenumber,
        ticketCount: selectedTickets,
      })
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Lỗi khi tạo link thanh toán');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Có lỗi xảy ra, vui lòng thử lại!');
  }
};



  return (
    <div className="App">
      {stage === -1 && (
        <div className="inputin4">
<ul style={{ textAlign: 'left' }}>
  <p>
    <strong>TRAVÉZIAAAA</strong> là chuỗi sự kiện âm nhạc thường niên biểu diễn tại thành phố Hà Nội, được tổ chức bởi CLB <strong>Glee Ams</strong> - một trong những CLB nghệ thuật lớn nhất thuộc trường THPT Chuyên Hà Nội - Amsterdam. 
    Trải qua 22 đêm diễn thành công, TRAVÉZIA vẫn luôn giữ được sức hút nhờ vào những màn diễn nhạc sống chỉn chu và ấn tượng.
  </p>

  <p>
    Trở lại lần này với tên gọi <strong>TRAVÉZIA XXIII: RETRO SPINS</strong>, Glee Ams hứa hẹn sẽ mang đến những trải nghiệm khó quên trong lòng khán giả trong đêm nhạc sắp tới. 
  </p>
  <br></br>
  <h3>Thông tin sự kiện:</h3>
  <ul>
    <li><strong>Thời gian:</strong> 18h30 - 22h00 ngày 30/3/2024</li>
    <li><strong>Địa điểm:</strong> The Hut Lakeside Lounge Bar - 51 Ng. 52 Đ. Tô Ngọc Vân, Nhật Tân, Tây Hồ, Hà Nội</li>
  </ul>

  <p>
    Một đêm nhạc với những tiết mục được đầu tư chỉn chu cùng nhiều cung bậc cảm xúc được truyền tải bằng giai điệu. 
    Liệu bạn đã sẵn sàng để tận hưởng những điều bất ngờ cùng chúng mình?
  </p>
  <br></br>
  <hr/>
  <br></br>

  <h3>Mọi thông tin xin liên hệ:</h3>
  <ul>
    <li><strong>Email:</strong> gleeams.2324@gmail.com</li>
    <li><strong>abc:</strong>cde </li>
    <li><strong>...:</strong>...</li>
    <li><strong>...:</strong>... </li>
  </ul>
  <br/>
</ul>
        <button onClick={nextStage} className='button'>Mua vé</button>
        </div>
      )}
      {stage === 0 && (
        <form onSubmit={handleSubmit} className="inputin4">
          <h1>Thông tin cá nhân</h1>
          <h3>Lưu ý: Vui lòng điền đầy đủ tất cả các thông tin cá nhân!</h3>
          <div>
            <h2>Họ và tên: *</h2>
            <input
              className="HoTen"
              type="text"
              value={Name}
              onChange={handleNameChange}
              placeholder="Ví dụ: Đỗ Trí Lâm"
              required
            />
          </div>
          <div>
            <h2>Số điện thoại: *</h2>
            <input
              className="SoDienThoai"
              type="tel"
              value={Phonenumber}
              onChange={handlePhonenumberChange}
              placeholder="Chỉ nhập số 0-9 (Ví dụ: 0904848999)"
              pattern="[0-9]{10,11}"
              onInvalid={(e) => e.target.setCustomValidity("Số điện thoại không hợp lệ")}
              onInput={(e) => e.target.setCustomValidity("")} // Đặt lại thông báo khi người dùng sửa
              required
            />
          </div>
          <div>
            <h2>Email: *</h2>
            <input
              className="email"
              type="email"
              value={Email}
              onChange={handleEmailChange}
              placeholder="Ví dụ: gleeams@gmail.com"
              pattern="[a-zA-Z0-9._%+-]+@gmail\.com$"
              title="Email phải kết thúc bằng @gmail.com"
              onInvalid={(e) => e.target.setCustomValidity("Email không hợp lệ")}
              onInput={(e) => e.target.setCustomValidity("")} // Đặt lại thông báo khi người dùng sửa
              required
            />
          </div>
          <div>
            <h2>Số lượng vé đăng kí: *</h2>
            <h3>Lưu ý: Đối với những ai có nhu cầu mua nhiều hơn 3 vé, mọi người vui lòng điền lại đơn!</h3>
            <div className="Soluongve">
              {[1, 2, 3].map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelection(option)}
                  type="button"
                  className={selectedTickets === option ? 'selected' : 'ticket-button'}
                >
                  {option}
                </button>
              ))}
            </div>
            <p>Bạn đã chọn: {selectedTickets || "Chưa chọn"} vé </p>
          </div>
          <br/>
          <button type="submit">Tiếp theo</button>
        </form>
      )}
      {stage === 1 && (
        <div>
          <h2>Chọn chỗ ngồi</h2>
          <div className='Soluongve'>
            {seats.map((x) => (
              <button
                key={x}
                onClick={() => handleSeatChosen(x)}
                type="button"
                className={selectedSeats.includes(x) ? 'selected' : 'ticket-button'}
              >
                {x}
              </button>
            ))}
          </div>
          <p>Đã chọn: {selectedSeats.join(', ') || 'Chưa chọn'}</p>
          <button onClick={nextStage}>Tiếp theo</button>
          <button onClick={backStage}>Quay lại</button>
        </div>
      )}
      {stage === 2 && (
        <div className="payinginfor">
          <h1>Hoàn tất thanh toán</h1>
          <div>
            <p>Cảm ơn quý khách đã đặt vé tham dự Travézia XXIII: Retro Spins. Glee Ams xin gửi thông tin thanh toán dưới đây:</p>
            <ul>
              <li><strong>Giá vé:</strong> 119.000 VND/vé (gia ve dang la 10k luc test)</li>
              <li><strong>STK:</strong> ...</li>
              <li><strong>Nội dung chuyển khoản:</strong> [HỌ VÀ TÊN - SỐ ĐIỆN THOẠI - SỐ LƯỢNG VÉ]</li>
              <li><strong>Thông tin người mua vé:</strong></li>
              <ul>
                <li>Họ và tên: {Name}</li>
                <li>Số điện thoại: {Phonenumber}</li>
                <li>Email: {Email}</li>
                <li>Số lượng vé: {selectedTickets}</li>
              </ul>
            </ul>
            <button onClick={backStage}>Đặt lại thông tin cá nhân</button>
            <br/>
            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Quý khách vui lòng chuyển khoản đúng số lượng vé mình đã đăng kí trong link.</li>
              <li>Quý khách vui lòng thanh toán và chụp màn hình chuyển khoản theo mục dưới đây.</li>
            </ul>
            <p>Nếu có sai sót về thông tin đặt chỗ hoặc không nhận được email xác nhận 24 giờ từ khi quý khách thanh toán, vui lòng nhắn tin cho page Glee Ams để thông báo về vấn đề đang gặp phải. Hoặc quý khách có thể liên hệ một trong các số điện thoại sau:</p>
            <ul>
              <li>...</li>
              <li>...</li>
              <li>...</li>
            </ul>
            <p>Một lần nữa, Glee Ams xin chân thành cảm ơn sự quan tâm của quý khách dành cho Travézia XXIII: Retro Spins.</p>
            <p><strong>Trân trọng!</strong></p>
            <br/>
            <button type="button" onClick={handlePayment}>Thanh toán</button>
          </div>
        </div>
      )}
    </div>
  );
}


export default App;