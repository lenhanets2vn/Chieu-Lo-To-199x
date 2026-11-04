import image1 from '../../assets/images/char_net_pro_1793699588511.jpg';
import image2 from '../../assets/images/char_nu_hoang_blog_1793701508082.jpg';
import image3 from '../../assets/images/char_ma_mi_1793701506650.jpg';
import image4 from '../../assets/images/char_sister_ba_1793699573476.jpg';
import image5 from '../../assets/images/char_chi_bay_hot_xoan_1793701510531.jpg';
import image6 from '../../assets/images/char_chu_chin_1793701508061.jpg';
import image7 from '../../assets/images/char_be_bong_1793701508153.jpg';
import image8 from '../../assets/images/char_bac_lieu_1793699588362.jpg';
import image9 from '../../assets/images/char_bac_ba_nong_trai_1793701510113.jpg';
import image11 from '../../assets/images/char_anh_bay_1793701508907.jpg';
/**
 * Danh sách 10 nhân vật và kỹ năng đặc trưng chuẩn phong cách Lô Tô & Hoài Niệm 9x.
 * Đã có đầy đủ 10 ảnh đại diện chất lượng cao 1:1.
 */

export interface CharacterSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldownSeconds: number;
  triggerType: 'active' | 'passive';
}

export interface Character {
  id: string;
  name: string;
  title: string;
  era: string;
  avatar: string;
  quote: string;
  activeSkill: CharacterSkill;
  passiveSkill: CharacterSkill;
  themeColor: string;
}

export const CHARACTERS: Character[] = [
  {
    id: 'chi_ba',
    name: 'Chị Ba Lô Tô',
    title: 'Nghệ Sĩ Gánh Hát Cửu Long',
    era: 'Hội Chợ 1994',
    avatar: image4,
    quote: 'Gì đây con số gì đây, bà con dòm kỹ tay tui xóc lồng!',
    activeSkill: {
      id: 'ho_do_van',
      name: 'Hò Kêu Đỏ Vận',
      description: 'Cầu may mắn! Tăng tỉ lệ bi tiếp theo rơi vào đúng hàng bạn đang chờ kinh.',
      icon: 'Mic2',
      cooldownSeconds: 40,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'duyen_san_khau',
      name: 'Duyên Sân Khấu',
      description: 'Nhận thêm +35% điểm Kinh Nghiệm (EXP) và danh vọng sau mỗi ván chơi.',
      icon: 'Sparkles',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-pink-600 to-rose-700'
  },
  {
    id: 'cu_teo',
    name: 'Cu Tèo Net Cỏ',
    title: 'Cao Thủ Bàn Phím Quán Nét',
    era: 'Quán Nét 2002',
    avatar: image1,
    quote: 'Chờ xíu đang bận cắm chuột cày game, mà lô tô thì bao ăn trọn!',
    activeSkill: {
      id: 'mat_than_crt',
      name: 'Mắt Thần Màn CRT',
      description: 'Tự động quét và viền sáng vàng rực số vừa bốc trên vé trong 5 giây.',
      icon: 'Eye',
      cooldownSeconds: 25,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'toc_do_apm',
      name: 'APM Bàn Phím 300',
      description: 'Tự động dò số siêu tốc với độ chính xác tuyệt đối.',
      icon: 'Zap',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-cyan-600 to-blue-700'
  },
  {
    id: 'cong_tu',
    name: 'Công Tử Bạc Liêu',
    title: 'Đại Gia Phố Cổ Nam Kỳ',
    era: 'Nam Bộ 1996',
    avatar: image8,
    quote: 'Tiền bạc là phù du, trúng con Lô Tô mới làm ta nở mày nở mặt!',
    activeSkill: {
      id: 'dot_tien_lac_long',
      name: 'Lắc Lại Bi Cầu',
      description: 'Không ưng bi vừa bốc? Lắc lồng cầu rút lại 1 bi may mắn khác!',
      icon: 'RefreshCw',
      cooldownSeconds: 60,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'tai_loc_vo_bien',
      name: 'Phúc Tinh Chiếu Mệnh',
      description: 'Nhận x2 lượng Tiền Vàng và Xu Hội Chợ khi hô Kinh thành công.',
      icon: 'Coins',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-amber-600 to-yellow-600'
  },
  {
    id: 'ma_mi',
    name: 'Má Mì Giám Khảo',
    title: 'Trưởng Ban Soi Vé Hội Chợ',
    era: 'Đoàn Hoa Nắng 1990',
    avatar: image3,
    quote: 'Vé nào kinh bước lên đây! Một hột bắp đặt sai là tui trừ giải ráng chịu!',
    activeSkill: {
      id: 'soi_kinh_nhanh',
      name: 'Kính Lúp Bắt Hàng',
      description: 'Chỉ điểm ngay hàng đang có 4/5 số (chỉ còn thiếu 1 con là KINH)!',
      icon: 'Search',
      cooldownSeconds: 30,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'uy_tin_tram_nam',
      name: 'Uy Quyền Sân Khấu',
      description: 'Không bao giờ bị phạt khi bấm nhầm nút Kinh.',
      icon: 'ShieldCheck',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-purple-600 to-violet-800'
  },
  {
    id: 'be_bong',
    name: 'Bé Bông Hột Bắp',
    title: 'Thần Đồng Phát Vé Dạo',
    era: 'Gánh Hát Đình Làng',
    avatar: image7,
    quote: 'Mua vé ủng hộ con đi cô chú ơi, vé này lát nữa bao Kinh đậm!',
    activeSkill: {
      id: 'hat_bap_may_man',
      name: 'Hột Bắp Ban Phước',
      description: 'Đánh dấu ngay lập tức 1 số bất kỳ có trên vé của bạn vào đầu ván.',
      icon: 'Gift',
      cooldownSeconds: 60,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'duyen_ban_ve',
      name: 'Thần Tài Nhí',
      description: 'Được giảm giá 20% khi mua vật phẩm emoji tại Tạp Hóa.',
      icon: 'Award',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-emerald-600 to-teal-700'
  },
  {
    id: 'anh_bay_hu_tieu',
    name: 'Anh Bảy Hủ Tiếu Gõ',
    title: 'Nghệ Nhân Lắc Muỗng Đêm Khuya',
    era: 'Hẻm Sài Gòn 1998',
    avatar: image11,
    quote: 'Cốc cốc keng keng! Làm tô hủ tiếu giò nạc lấy sức dò Lô Tô nha!',
    activeSkill: {
      id: 'tieng_go_hutieu',
      name: 'Nhịp Muỗng Đỏ Vận',
      description: 'Gõ muỗng tiếp sức! Giảm 10 giây thời gian hồi chiêu của toàn đội.',
      icon: 'Utensils',
      cooldownSeconds: 35,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'hu_tieu_am_bung',
      name: 'Ấm Bụng Bền Gan',
      description: 'Nhận thêm 100 Xu hội chợ sau mỗi ván dù thắng hay bại.',
      icon: 'Coffee',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-orange-600 to-amber-700'
  },
  {
    id: 'chu_chin_keo_keo',
    name: 'Chú Chín Kẹo Kéo',
    title: 'Vua Hát Rong Bấm Chuông',
    era: 'Đình Làng Nam Bộ',
    avatar: image6,
    quote: 'Kẹo kéo càng kéo càng dài, ai chưa trúng số đêm nay trúng liền!',
    activeSkill: {
      id: 'keo_keo_dinh_so',
      name: 'Kẹo Dẻo Dính Số',
      description: 'Kéo dính vận may! Làm chậm nhịp xướng số kế tiếp 3 giây để cả làng chuẩn bị.',
      icon: 'Candy',
      cooldownSeconds: 45,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'lo_keo_keo',
      name: 'Loa Thùng Di Động',
      description: 'Giọng hò xướng âm to và rõ hơn, tăng 15% may mắn trúng giải phụ.',
      icon: 'Volume2',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-red-600 to-rose-800'
  },
  {
    id: 'nu_hoang_blog',
    name: 'Nữ Hoàng Nhật Ký 9x',
    title: 'Tiểu Thư Mạng Xã Hội 2008',
    era: 'Thời Kỳ Web 2.0',
    avatar: image2,
    quote: 'Buzz tui làm chi, vô trang cá nhân ngắm hoa tuyết rơi nè ~*xOxO*~',
    activeSkill: {
      id: 'buzz_rung_rinh',
      name: 'Bão Chuông Rung Động',
      description: 'Tạo hiệu ứng hào quang lấp lánh và highlight toàn bộ các số đã kêu trên vé.',
      icon: 'BellRing',
      cooldownSeconds: 30,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'luot_view_khung',
      name: 'Tâm Điểm Chú Ý',
      description: 'Chat trong phòng sẽ có khung viền hồng neon lấp lánh chuẩn 9x.',
      icon: 'Heart',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-fuchsia-600 to-pink-700'
  },
  {
    id: 'bac_ba_nong_trai',
    name: 'Bác Ba Nông Trại Xanh',
    title: 'Đại Điền Chủ Game Nông Nghiệp',
    era: 'Kỷ Nguyên Nông Trại 2000s',
    avatar: image9,
    quote: 'Trồng bắp thu hoạch củ cải, đem bán lấy tiền mua trọn tờ Lô Tô!',
    activeSkill: {
      id: 'mua_vang_boi_thu',
      name: 'Mùa Vàng Bội Thu',
      description: 'Thu hoạch lộc trời! Nhận ngay 200 Xu và đánh dấu ngẫu nhiên 1 ô trên vé.',
      icon: 'Wheat',
      cooldownSeconds: 50,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'nong_dan_cham_chi',
      name: 'Bàn Tay Vàng',
      description: 'Tăng 25% tỷ lệ nhận được vật phẩm hiếm khi thăng cấp.',
      icon: 'Sprout',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-green-600 to-emerald-800'
  },
  {
    id: 'chi_bay_hot_xoan',
    name: 'Chị Bảy Hột Xoàn',
    title: 'Nữ Đại Gia Tiệm Vàng Phố Huyện',
    era: 'Chợ Lớn 1995',
    avatar: image5,
    quote: 'Vàng đeo trĩu cổ, chơi Lô Tô là vì đam mê tiếng trống xướng ca!',
    activeSkill: {
      id: 'hot_xoan_chieu_menh',
      name: 'Hột Xoàn Phát Sáng',
      description: 'Tỏa ánh sáng kim cương làm sáng bừng số may mắn kế tiếp trên bảng tổng duyệt!',
      icon: 'Gem',
      cooldownSeconds: 50,
      triggerType: 'active'
    },
    passiveSkill: {
      id: 'tai_phu_ngut_ngan',
      name: 'Phúc Khí Đại Gia',
      description: 'Nhận x3 điểm Kinh Nghiệm (EXP) khi hô Kinh trúng giải!',
      icon: 'Crown',
      cooldownSeconds: 0,
      triggerType: 'passive'
    },
    themeColor: 'from-yellow-500 to-amber-700'
  }
];

export function getCharacterById(id: string): Character {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
