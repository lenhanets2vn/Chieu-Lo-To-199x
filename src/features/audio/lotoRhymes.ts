/**
 * Kho câu hò, vè, câu đố Lô Tô hội chợ truyền thống Nam Bộ / Việt Nam thập niên 90s.
 * Bao gồm câu rao mở màn và câu hò đặc trưng cho các con số từ 1 đến 99.
 */

export interface LotoRhyme {
  number: number;
  intro: string;
  rhyme: string;
  callOut: string; // Tên xướng âm thanh lúc chốt số
}

// Các câu dạo đầu kinh điển trước khi bốc bi
export const INTRO_CALLS: string[] = [
  "Cờ ra con mấy, con mấy gì ra, cờ ra con mấy, con mấy gì ra...",
  "Gì đây gì đây, con số gì đây, tay quay lồng cầu, bi lăn lóc cóc...",
  "Lắng tai nghe tiếng hát, mắt nhìn kỹ tờ kinh, ai may mắn trúng giải...",
  "Mời bà con cô bác dòm vô tấm giấy, tay cầm hột bắp, số nào trúng thì đặt vô...",
  "Bà con dòm kỹ nghen, tui quay lồng sắt, bi lăn ra liền...",
  "Chiêng reo trống giục, ai có duyên thời trúng lớn, con số gì ra...",
  "Hội chợ đêm xuân, đèn hoa rực rỡ, đón lộc đầu năm...",
  "Chị Bảy anh Tám, dòm kỹ tờ loto, đừng để lọt số nghen bà con!"
];

// Danh sách câu hò cho 99 con số
export const LOTO_RHYMES: Record<number, LotoRhyme> = {
  1: {
    number: 1,
    intro: "Mở đầu phát lộc",
    rhyme: "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao... Con số",
    callOut: "Số Một! Con Một!"
  },
  2: {
    number: 2,
    intro: "Đôi lứa xứng đôi",
    rhyme: "Chim khôn đậu nhánh trúc xinh, bướm lượn cành quỳnh tình thắm duyên quê... Con số",
    callOut: "Số Hai! Hai mươi trừ mười tám ra con Hai!"
  },
  3: {
    number: 3,
    intro: "Tam tài phát lộc",
    rhyme: "Ba chìm bảy nổi chín lênh đênh, thương em vất vả gập ghềnh đường xa... Con số",
    callOut: "Số Ba! Con Ba!"
  },
  4: {
    number: 4,
    intro: "Tứ hải giai huynh đệ",
    rhyme: "Bốn mùa hoa nở ngát hương, anh đi muôn dặm vấn vương bóng nàng... Con số",
    callOut: "Số Bốn! Con Bốn!"
  },
  5: {
    number: 5,
    intro: "Năm cánh sao vàng",
    rhyme: "Năm tao bảy tuyết đợi chờ, bao năm cách trở bây giờ gặp em... Con số",
    callOut: "Số Năm! Con Năm!"
  },
  6: {
    number: 6,
    intro: "Sáu câu vọng cổ",
    rhyme: "Sáu câu khúc hát ân tình, nghe tiếng đàn kìm ru ngọt bờ sông... Con số",
    callOut: "Số Sáu! Con Sáu!"
  },
  7: {
    number: 7,
    intro: "Thất tinh tỏa sáng",
    rhyme: "Bảy ngày đợi bảy đêm mong, con nước xuôi dòng đưa chuyến đò sang... Con số",
    callOut: "Số Bảy! Con Bảy!"
  },
  8: {
    number: 8,
    intro: "Bát bửu vinh hoa",
    rhyme: "Tám hướng gió thổi mây bay, anh về xứ bưởi đắm say tình nồng... Con số",
    callOut: "Số Tám! Con Tám!"
  },
  9: {
    number: 9,
    intro: "Chín tầng mây biếc",
    rhyme: "Chín con sông đỏ phù sa, dập dìu ghe chiếu ghé phà Vàm Cống... Con số",
    callOut: "Số Chín! Con Chín!"
  },
  10: {
    number: 10,
    intro: "Mười phân vẹn mười",
    rhyme: "Một thương tóc bỏ đuôi gà, mười thương em gái thật thà nết na... Mười thương là con",
    callOut: "Mười! Con Số Mười!"
  },
  11: {
    number: 11,
    intro: "Một đôi đứng cạnh",
    rhyme: "Hai que tăm thẳng tắp đứng bên nhau, như đôi đũa ngọc mâm dâu ngày lành... Con",
    callOut: "Mười Một! Con Mười Một!"
  },
  12: {
    number: 12,
    intro: "Mười hai bến nước",
    rhyme: "Thương thân em gái mười hai bến nước, biết đâu bến trong bến đục mà lường... Con",
    callOut: "Mười Hai! Con Mười Hai!"
  },
  13: {
    number: 13,
    intro: "Trăng tròn mười ba",
    rhyme: "Mười ba trăng khuyết đợi rằm, anh ngồi anh ngóng xa xăm phương trời... Con",
    callOut: "Mười Ba! Con Mười Ba!"
  },
  14: {
    number: 14,
    intro: "Mười bốn trăng non",
    rhyme: "Trăng thanh gió mát trăng soi đầu cành, đêm hẹn ước thề non hẹn biển... Con",
    callOut: "Mười Bốn! Con Mười Bốn!"
  },
  15: {
    number: 15,
    intro: "Rằm trăng tròn vành vạnh",
    rhyme: "Mười lăm rằm sáng lung linh, chúc cho bá tánh an bình ấm no... Con",
    callOut: "Mười Lăm! Con Mười Lăm!"
  },
  16: {
    number: 16,
    intro: "Trăng tròn mười sáu",
    rhyme: "Em như trăng sáng tròn mười sáu, má phấn môi son xinh thắm nụ cười... Con",
    callOut: "Mười Sáu! Con Mười Sáu!"
  },
  17: {
    number: 17,
    intro: "Mười bảy bẻ gãy sừng trâu",
    rhyme: "Tuổi trẻ hăng say chí lớn ngập tràn, công danh sự nghiệp rạng ngời mai sau... Con",
    callOut: "Mười Bảy! Con Mười Bảy!"
  },
  18: {
    number: 18,
    intro: "Tuổi mười tám tươi đẹp",
    rhyme: "Mười tám tuổi trăng tròn tươi thắm, bước chân rộn rã trên con đường làng... Con",
    callOut: "Mười Tám! Con Mười Tám!"
  },
  19: {
    number: 19,
    intro: "Mười chín đôi mươi",
    rhyme: "Thanh xuân phơi phới môi cười, tương lai rộng mở rạng ngời niềm tin... Con",
    callOut: "Mười Chín! Con Mười Chín!"
  },
  20: {
    number: 20,
    intro: "Tròn trĩnh hai mươi",
    rhyme: "Hai mươi năm ấy biết bao ân tình, đôi ta gắn kết duyên mình đậm sâu... Con",
    callOut: "Hai Mươi! Con Hai Mươi!"
  },
  21: {
    number: 21,
    intro: "Hai mươi mốt",
    rhyme: "Một bước lên hoa hai bước xuống kiệu, xe hoa rước dâu pháo nổ tưng bừng... Con",
    callOut: "Hai Mươi Mốt! Hai Mốt!"
  },
  22: {
    number: 22,
    intro: "Đôi thiên nga trắng",
    rhyme: "Hai mươi hai tuổi đôi ngỗng lượn quanh hồ sen ngát hương thơm lừng... Con",
    callOut: "Hai Mươi Hai! Con Hai Hai!"
  },
  23: {
    number: 23,
    intro: "Hai mươi ba ông Táo",
    rhyme: "Hai mươi ba tiễn Táo quân về trời, cưỡi cá chép vàng cầu lộc an khang... Con",
    callOut: "Hai Mươi Ba! Con Hai Ba!"
  },
  24: {
    number: 24,
    intro: "Hai mươi bốn tiếng",
    rhyme: "Một ngày hai mươi bốn giờ nhớ thương, đêm ngày tơ tưởng bóng hình người thương... Con",
    callOut: "Hai Mươi Bốn! Hai Bốn!"
  },
  25: {
    number: 25,
    intro: "Năm hai mươi lăm",
    rhyme: "Xuân đi xuân lại xuân sang, trăm hoa đua nở ngập tràn niềm vui... Con",
    callOut: "Hai Mươi Lăm! Hai Nhăm!"
  },
  26: {
    number: 26,
    intro: "Hai mươi sáu",
    rhyme: "Gió lay cành trúc le te, tiếng đàn ai dạo não nề bên hiên... Con",
    callOut: "Hai Mươi Sáu! Hai Sáu!"
  },
  27: {
    number: 27,
    intro: "Hai mươi bảy",
    rhyme: "Qua cầu rụng phấn rơi hoa, thương em dầu dãi đường xa phong trần... Con",
    callOut: "Hai Mươi Bảy! Hai Bảy!"
  },
  28: {
    number: 28,
    intro: "Hai mươi tám",
    rhyme: "Dẫu cho sông cạn đá mòn, dạ này son sắt vuông tròn trước sau... Con",
    callOut: "Hai Mươi Tám! Hai Tám!"
  },
  29: {
    number: 29,
    intro: "Hai mươi chín",
    rhyme: "Hai chín Tết bận gói bánh chưng xanh, mai vàng hé nụ ngọt lành tình xuân... Con",
    callOut: "Hai Mươi Chín! Hai Chín!"
  },
  30: {
    number: 30,
    intro: "Ba mươi Tết đến",
    rhyme: "Ba mươi giao thừa pháo nổ vang trời, đón mừng xuân mới người người tươi vui... Con",
    callOut: "Ba Mươi! Con Ba Mươi!"
  },
  31: {
    number: 31,
    intro: "Ba mươi mốt",
    rhyme: "Hội hè nô nức phương xa, dập dìu trai gái gần xa trẩy mùa... Con",
    callOut: "Ba Mươi Mốt! Ba Mốt!"
  },
  32: {
    number: 32,
    intro: "Ba mươi hai",
    rhyme: "Trầu vàng têm cánh phượng bay, đưa cay chén rượu đong đầy nghĩa nhân... Con",
    callOut: "Ba Mươi Hai! Ba Hai!"
  },
  33: {
    number: 33,
    intro: "Ba mươi ba ngọn đèn",
    rhyme: "Đêm đêm thắp ngọn đèn trời, cầu cho cha mẹ trọn đời bình an... Con",
    callOut: "Ba Mươi Ba! Con Ba Ba!"
  },
  34: {
    number: 34,
    intro: "Ba mươi bốn",
    rhyme: "Bốn bề non nước gấm hoa, một dải giang sơn mặn mà phù sa... Con",
    callOut: "Ba Mươi Bốn! Ba Bốn!"
  },
  35: {
    number: 35,
    intro: "Ba mươi lăm con dê",
    rhyme: "Râu dài lững thững bờ đê, chiều hôm gặm cỏ men lề suối reo... Con",
    callOut: "Ba Mươi Lăm! Ba Lăm!"
  },
  36: {
    number: 36,
    intro: "Ba mươi sáu phố phường",
    rhyme: "Ba mươi sáu phố kinh kỳ, Hàng Đào Hàng Bạc khắc ghi ngàn đời... Con",
    callOut: "Ba Mươi Sáu! Ba Sáu!"
  },
  37: {
    number: 37,
    intro: "Ba mươi bảy",
    rhyme: "Mẹ già dãi nắng dầm mưa, nuôi con khôn lớn sớm trưa tảo tần... Con",
    callOut: "Ba Mươi Bảy! Ba Bảy!"
  },
  38: {
    number: 38,
    intro: "Ba mươi tám",
    rhyme: "Cây cao bóng mát che đầu, ơn cha nghĩa mẹ biển sâu khôn dò... Con",
    callOut: "Ba Mươi Tám! Ba Tám!"
  },
  39: {
    number: 39,
    intro: "Thần tài nhỏ",
    rhyme: "Thần tài gõ cửa ban tài, lộc vào như nước tháng ngày ấm no... Thần tài nhỏ là con",
    callOut: "Ba Mươi Chín! Ba Chín Thần Tài Nhỏ!"
  },
  40: {
    number: 40,
    intro: "Bốn mươi tròn",
    rhyme: "Bốn mươi tuổi độ phong trần, công thành danh toại muôn phần vẻ vang... Con",
    callOut: "Bốn Mươi! Con Bốn Mươi!"
  },
  41: {
    number: 41,
    intro: "Bốn mươi mốt",
    rhyme: "Con cá bơi lội dưới sông, con chim bay liệng tầng không tìm đàn... Con",
    callOut: "Bốn Mươi Mốt! Bốn Mốt!"
  },
  42: {
    number: 42,
    intro: "Bốn mươi hai",
    rhyme: "Trời cao lồng lộng gió lay, thuyền xuôi một bóng tháng ngày bình yên... Con",
    callOut: "Bốn Mươi Hai! Bốn Hai!"
  },
  43: {
    number: 43,
    intro: "Bốn mươi ba",
    rhyme: "Đêm qua ra đứng bờ ao, ngó sao sao lặn ngó lau lau buồn... Con",
    callOut: "Bốn Mươi Ba! Bốn Ba!"
  },
  44: {
    number: 44,
    intro: "Tứ tử bốn mươi bốn",
    rhyme: "Bốn con bốn đứng song đôi, như rồng như phượng giữa trời vẫy vùng... Con",
    callOut: "Bốn Mươi Bốn! Bốn Bốn!"
  },
  45: {
    number: 45,
    intro: "Bốn mươi lăm",
    rhyme: "Năm tháng trôi mãi không chờ, tình người đằm thắm bến bờ thủy chung... Con",
    callOut: "Bốn Mươi Lăm! Bốn Lăm!"
  },
  46: {
    number: 46,
    intro: "Bốn mươi sáu",
    rhyme: "Nhớ ai dãi nắng dầm sương, thương ai góc chợ ven đường bán buôn... Con",
    callOut: "Bốn Mươi Sáu! Bốn Sáu!"
  },
  47: {
    number: 47,
    intro: "Bốn mươi bảy",
    rhyme: "Bảy nổi ba chìm với nước non, tấm lòng son sắt mãi còn khắc ghi... Con",
    callOut: "Bốn Mươi Bảy! Bốn Bảy!"
  },
  48: {
    number: 48,
    intro: "Bốn mươi tám",
    rhyme: "Đồng xanh bát ngát chân trời, cò bay thẳng cánh muôn đời no say... Con",
    callOut: "Bốn Mươi Tám! Bốn Tám!"
  },
  49: {
    number: 49,
    intro: "Bốn mươi chín",
    rhyme: "Qua cơn giông bão ngút ngàn, bình minh rạng rỡ muôn vàn sắc xuân... Con",
    callOut: "Bốn Mươi Chín! Bốn Chín!"
  },
  50: {
    number: 50,
    intro: "Năm mươi nửa đời",
    rhyme: "Nửa đời sương gió phong phanh, tình nhà nghĩa nước trọn vành yêu thương... Con",
    callOut: "Năm Mươi! Con Năm Mươi!"
  },
  51: {
    number: 51,
    intro: "Năm mươi mốt",
    rhyme: "Một lời đã hứa đinh ninh, nghìn năm giữ trọn bóng hình trong tim... Con",
    callOut: "Năm Mươi Mốt! Năm Mốt!"
  },
  52: {
    number: 52,
    intro: "Năm mươi hai",
    rhyme: "Hai tay nâng chén rượu mừng, chúc cho duyên thắm tương phùng bền lâu... Con",
    callOut: "Năm Mươi Hai! Năm Hai!"
  },
  53: {
    number: 53,
    intro: "Năm mươi ba",
    rhyme: "Dù ai xuôi ngược trăm miền, nhớ về hội tụ gắn liền tình quê... Con",
    callOut: "Năm Mươi Ba! Năm Ba!"
  },
  54: {
    number: 54,
    intro: "Năm mươi bốn dân tộc",
    rhyme: "Năm mươi tư dân tộc anh em, một lòng đoàn kết ấm êm nước nhà... Con",
    callOut: "Năm Mươi Bốn! Năm Bốn!"
  },
  55: {
    number: 55,
    intro: "Song ngũ năm mươi lăm",
    rhyme: "Đôi năm đứng cạnh oai hùng, lộc tài nhân đôi vẫy vùng bốn phương... Con",
    callOut: "Năm Mươi Lăm! Năm Lăm!"
  },
  56: {
    number: 56,
    intro: "Năm mươi sáu",
    rhyme: "Mưa rơi ướt áo ai rồi, để lòng vương vấn bồi hồi khôn nguôi... Con",
    callOut: "Năm Mươi Sáu! Năm Sáu!"
  },
  57: {
    number: 57,
    intro: "Năm mươi bảy",
    rhyme: "Bảy sắc cầu vồng sau mưa, như câu thề hứa năm xưa trao người... Con",
    callOut: "Năm Mươi Bảy! Năm Bảy!"
  },
  58: {
    number: 58,
    intro: "Năm mươi tám",
    rhyme: "Đêm nghe tiếng hát đò đưa, ngân nga câu hát tiễn đưa khách làng... Con",
    callOut: "Năm Mươi Tám! Năm Tám!"
  },
  59: {
    number: 59,
    intro: "Năm mươi chín",
    rhyme: "Chín đợi mười trông mỏi mòn, tình xưa nghĩa cũ vuông tròn chẳng phai... Con",
    callOut: "Năm Mươi Chín! Năm Chín!"
  },
  60: {
    number: 60,
    intro: "Sáu mươi năm cuộc đời",
    rhyme: "Em ơi có bao nhiêu, sáu mươi năm cuộc đời, hai mươi năm đầu sung sướng không lo... Con",
    callOut: "Sáu Mươi! Sáu Mươi Năm Cuộc Đời!"
  },
  61: {
    number: 61,
    intro: "Sáu mươi mốt",
    rhyme: "Cây đa bến nước sân đình, rộn ràng điệu múa quê mình đêm trăng... Con",
    callOut: "Sáu Mươi Mốt! Sáu Mốt!"
  },
  62: {
    number: 62,
    intro: "Sáu mươi hai",
    rhyme: "Thương ai dãi gió dầm sương, tay bưng thúng gạo trên đường chiều hôm... Con",
    callOut: "Sáu Mươi Hai! Sáu Hai!"
  },
  63: {
    number: 63,
    intro: "Sáu mươi ba",
    rhyme: "Rừng vàng biển bạc mênh mông, tình người non nước mặn nồng muôn sau... Con",
    callOut: "Sáu Mươi Ba! Sáu Ba!"
  },
  64: {
    number: 64,
    intro: "Sáu mươi bốn",
    rhyme: "Bốn mùa thay lá đơm bông, thược dược nở rộ đón lòng xuân vui... Con",
    callOut: "Sáu Mươi Bốn! Sáu Bốn!"
  },
  65: {
    number: 65,
    intro: "Sáu mươi lăm",
    rhyme: "Lúa chín vàng óng trên nương, bà con gặt hái ngát hương ngọt ngào... Con",
    callOut: "Sáu Mươi Lăm! Sáu Lăm!"
  },
  66: {
    number: 66,
    intro: "Song lộc sáu mươi sáu",
    rhyme: "Hai số sáu tài lộc đầy nhà, làm ăn tấn tới ấm no sum vầy... Con",
    callOut: "Sáu Mươi Sáu! Song Lộc Sáu Sáu!"
  },
  67: {
    number: 67,
    intro: "Chiếc xe sáu bảy huyền thoại",
    rhyme: "Tiếng nổ bình bịch giòn tai, xe Honda sáu bảy chở em dạo phố phường... Con",
    callOut: "Sáu Mươi Bảy! Xe Sáu Bảy!"
  },
  68: {
    number: 68,
    intro: "Lộc phát sáu mươi tám",
    rhyme: "Lộc tới phát tài phồn vinh, chúc cho vạn sự an khang phát tài... Con",
    callOut: "Sáu Mươi Tám! Lộc Phát Sáu Tám!"
  },
  69: {
    number: 69,
    intro: "Sáu mươi chín đảo đầu",
    rhyme: "Đầu xuôi đuôi lọt vẹn toàn, âm dương hòa hợp ngập tràn niềm vui... Con",
    callOut: "Sáu Mươi Chín! Sáu Chín!"
  },
  70: {
    number: 70,
    intro: "Bảy mươi xưa nay hiếm",
    rhyme: "Thất thập cổ lai hy, phúc như Đông Hải thọ tày Nam Sơn... Con",
    callOut: "Bảy Mươi! Con Bảy Mươi!"
  },
  71: {
    number: 71,
    intro: "Bảy mươi mốt",
    rhyme: "Một đàn chim én bay qua, báo tin mùa tết muôn nhà ấm êm... Con",
    callOut: "Bảy Mươi Mốt! Bảy Mốt!"
  },
  72: {
    number: 72,
    intro: "Bảy mươi hai phép thần thông",
    rhyme: "Tề Thiên Đại Thánh lẫy lừng, phép màu biến hóa trừ yêu cứu đời... Con",
    callOut: "Bảy Mươi Hai! Bảy Mươi Hai Phép Tề Thiên!"
  },
  73: {
    number: 73,
    intro: "Bảy mươi ba",
    rhyme: "Qua truông qua suối qua đèo, gặp nhau tình nghĩa hiểm nghèo sẻ chia... Con",
    callOut: "Bảy Mươi Ba! Bảy Ba!"
  },
  74: {
    number: 74,
    intro: "Bảy mươi bốn",
    rhyme: "Thuyền xuôi bến cát chiều tà, khói lam chiều bếp ấm nhà thôn quê... Con",
    callOut: "Bảy Mươi Bốn! Bảy Bốn!"
  },
  75: {
    number: 75,
    intro: "Bảy mươi lăm",
    rhyme: "Năm tháng lịch sử vẻ vang, non sông liền dải huy hoàng gấm hoa... Con",
    callOut: "Bảy Mươi Lăm! Bảy Lăm!"
  },
  76: {
    number: 76,
    intro: "Bảy mươi sáu",
    rhyme: "Hoa cúc rực rỡ vàng tươi, dâng lên bàn tổ nụ cười thành kính... Con",
    callOut: "Bảy Mươi Sáu! Bảy Sáu!"
  },
  77: {
    number: 77,
    intro: "Song thất bảy mươi bảy",
    rhyme: "Cầu Ô Thước bắc qua sông Ngân, Ngưu Lang Chức Nữ trùng phùng duyên xưa... Con",
    callOut: "Bảy Mươi Bảy! Song Thất Bảy Bảy!"
  },
  78: {
    number: 78,
    intro: "Ông địa lớn",
    rhyme: "Ông Địa bụng bự phe phẩy quạt mo, gia cư phát đạt ấm no muôn đời... Ông Địa lớn là con",
    callOut: "Bảy Mươi Tám! Bảy Tám Ông Địa Lớn!"
  },
  79: {
    number: 79,
    intro: "Thần tài lớn",
    rhyme: "Cung hỷ phát tài, rước ông Thần Tài vào nhà, tiền vô như nước bạc ngàn như mây... Thần tài lớn là con",
    callOut: "Bảy Mươi Chín! Bảy Chín Thần Tài Lớn!"
  },
  80: {
    number: 80,
    intro: "Tám mươi tuổi thọ",
    rhyme: "Bát tuần mừng thọ mẹ cha, cháu con sum họp mặn mà mừng xuân... Con",
    callOut: "Tám Mươi! Con Tám Mươi!"
  },
  81: {
    number: 81,
    intro: "Tám mươi mốt nạn",
    rhyme: "Đường Tăng thỉnh kinh ngút ngàn, tám mươi mốt kiếp gian nan vượt qua... Con",
    callOut: "Tám Mươi Mốt! Tám Mươi Mốt Kiếp Nạn!"
  },
  82: {
    number: 82,
    intro: "Tám mươi hai",
    rhyme: "Gió lay bông bưởi ngát lừng, hương bay muôn ngõ thơm lừng tình quê... Con",
    callOut: "Tám Mươi Hai! Tám Hai!"
  },
  83: {
    number: 83,
    intro: "Tám mươi ba",
    rhyme: "Thương nhau mấy núi cũng trèo, mấy sông cũng lội mấy đèo cũng qua... Con",
    callOut: "Tám Mươi Ba! Tám Ba!"
  },
  84: {
    number: 84,
    intro: "Mã vùng Việt Nam",
    rhyme: "Tự hào đất nước Việt Nam, tám mươi tư số kết đoàn năm châu... Con",
    callOut: "Tám Mươi Bốn! Tám Bốn!"
  },
  85: {
    number: 85,
    intro: "Tám mươi lăm",
    rhyme: "Trăm năm bia đá cũng mòn, nghìn năm bia miệng vẫn còn trơ trơ... Con",
    callOut: "Tám Mươi Lăm! Tám Lăm!"
  },
  86: {
    number: 86,
    intro: "Phát lộc tám mươi sáu",
    rhyme: "Phát lộc phát tài phát vinh hoa, tiền tài như ý vào nhà quanh năm... Con",
    callOut: "Tám Mươi Sáu! Phát Lộc Tám Sáu!"
  },
  87: {
    number: 87,
    intro: "Tám mươi bảy",
    rhyme: "Dẫu cho sông cạn đá mòn, ngàn năm dạ nhớ vuông tròn khắc sâu... Con",
    callOut: "Tám Mươi Bảy! Tám Bảy!"
  },
  88: {
    number: 88,
    intro: "Song phát đại phát tám mươi tám",
    rhyme: "Hai còng số tám rộn vang, buôn may bán đắt rộn ràng ấm êm... Con",
    callOut: "Tám Mươi Tám! Song Phát Tám Tám!"
  },
  89: {
    number: 89,
    intro: "Tám mươi chín",
    rhyme: "Bước sang ngưỡng cửa huy hoàng, tương lai sáng lạn ngập tràn ước mơ... Con",
    callOut: "Tám Mươi Chín! Tám Chín!"
  },
  90: {
    number: 90,
    intro: "Chín mươi trọn bộ",
    rhyme: "Chín mươi con số quay đều, ai chưa trúng giải đêm nay trúng liền... Chín mươi là con",
    callOut: "Chín Mươi! Chín Mươi Trọn Bộ!"
  },
  91: {
    number: 91,
    intro: "Chín mươi mốt",
    rhyme: "Cờ bay rợp bóng quê hương, non sông gấm vóc dặm trường ngát xanh... Con",
    callOut: "Chín Mươi Mốt! Chín Mốt!"
  },
  92: {
    number: 92,
    intro: "Chín mươi hai",
    rhyme: "Đêm trăng thanh dạo thuyền rồng, câu hò điệu lý thắm nồng phù sa... Con",
    callOut: "Chín Mươi Hai! Chín Hai!"
  },
  93: {
    number: 93,
    intro: "Chín mươi ba",
    rhyme: "Non cao biển rộng thênh thang, bước chân đi tới ngập tràn niềm vui... Con",
    callOut: "Chín Mươi Ba! Chín Ba!"
  },
  94: {
    number: 94,
    intro: "Chín mươi bốn",
    rhyme: "Năm tháng thanh bình yên ả, tiếng cười rộn rã xóm làng nở hoa... Con",
    callOut: "Chín Mươi Bốn! Chín Bốn!"
  },
  95: {
    number: 95,
    intro: "Chín mươi lăm",
    rhyme: "Tình quê tha thiết đậm đà, đi xa vẫn nhớ mái nhà thân thương... Con",
    callOut: "Chín Mươi Lăm! Chín Lăm!"
  },
  96: {
    number: 96,
    intro: "Chín mươi sáu",
    rhyme: "Tháng ngày gìn giữ cơ đồ, ngàn năm vững bước ngọn cờ quang vinh... Con",
    callOut: "Chín Mươi Sáu! Chín Sáu!"
  },
  97: {
    number: 97,
    intro: "Chín mươi bảy",
    rhyme: "Sông sâu cá lội biệt tăm, người đi phương ấy muôn dặm nhớ nhung... Con",
    callOut: "Chín Mươi Bảy! Chín Bảy!"
  },
  98: {
    number: 98,
    intro: "Chín mươi tám",
    rhyme: "Rồng bay phượng múa chào xuân, lộc tài hội tụ ngập tràn niềm vui... Con",
    callOut: "Chín Mươi Tám! Chín Tám!"
  },
  99: {
    number: 99,
    intro: "Đại thượng thượng chín mươi chín",
    rhyme: "Số cuối bảng vàng chốt hạ, chín mươi chín đỉnh cao trọn vẹn, ai may mắn trúng độc đắc đêm nay... Con",
    callOut: "Chín Mươi Chín! Cửu Cửu Đại Cát Chín Chín!"
  }
};

/**
 * Lấy câu thơ ngẫu nhiên hoặc theo số
 */
export function getRhymeForNumber(num: number): LotoRhyme {
  return LOTO_RHYMES[num] || {
    number: num,
    intro: "Gì đây con số gì đây",
    rhyme: `Cờ ra con mấy, con số ${num}...`,
    callOut: `Số ${num}!`
  };
}
