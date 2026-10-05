# -*- coding: utf-8 -*-
"""Xuất hai file Excel để kiểm tra thông tin đang có trong app.

Nguồn: js/data.js và js/i18n.js. Không thêm công thức mới.
"""
import json
import subprocess
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
ROOT = Path(__file__).resolve().parent

# (nhóm, tên Việt, tên Nhật, [(id thuốc, cụm chữ phải có trong câu Đối tượng)])
PESTS = [
    ("Sâu", "Sâu tơ", "コナガ", [
        ("dipel", "Sâu tơ"), ("secure", "Sâu tơ"), ("prevathon", "sâu tơ"),
        ("prevathon200", "sâu tơ"), ("benevia", "sâu tơ"), ("neem", "sâu tơ"), ("rimon", "Sâu tơ"),
    ]),
    ("Sâu", "Sâu cuốn lá", "ハマキムシ", [
        ("dipel", "sâu cuốn lá"), ("secure", "sâu cuốn lá"), ("prevathon", "Sâu cuốn lá"),
        ("prevathon200", "sâu cuốn lá"), ("permethrin", "sâu cuốn lá"),
        ("secsaigon", "Sâu cuốn lá"), ("cyrin", "Sâu cuốn lá"),
    ]),
    ("Sâu", "Sâu xanh", "アオムシ", [
        ("secure", "sâu xanh"), ("prevathon", "sâu xanh"), ("prevathon200", "sâu xanh"),
        ("benevia", "sâu xanh"), ("rimon", "sâu xanh"), ("secsaigon", "sâu xanh"), ("cyrin", "sâu xanh"),
    ]),
    ("Sâu", "Sâu xanh da láng", "ハスモンヨトウ", [
        ("permethrin", "sâu xanh da láng"), ("neem", "sâu xanh da láng"),
    ]),
    ("Sâu", "Sâu khoang", "ヨトウムシ", [("benevia", "sâu khoang")]),
    ("Sâu", "Sâu keo", "ツマジロクサヨトウ", [("dipel", "sâu keo")]),
    ("Sâu", "Sâu đục thân", "メイチュウ", [
        ("prevathon", "sâu đục thân"), ("prevathon200", "sâu đục thân"),
    ]),
    ("Sâu", "Sâu đục quả / đục trái", "果実を食害する幼虫", [
        ("permethrin", "sâu đục quả"), ("prevathon200", "sâu đục trái"),
    ]),
    ("Sâu", "Bọ xít muỗi", "カスミカメ", [
        ("dipel", "bọ xít muỗi"), ("permethrin", "bọ xít muỗi"),
    ]),
    ("Sâu", "Bọ xít", "カメムシ", [("dantotsu", "bọ xít")]),
    ("Sâu", "Bọ trĩ", "アザミウマ", [
        ("secure", "bọ trĩ"), ("benevia", "Bọ trĩ"), ("mospilan", "bọ trĩ"),
        ("mikhada", "bọ trĩ"), ("neem", "bọ trĩ"), ("thiamax", "bọ trĩ"),
        ("actara", "bọ trĩ"), ("dantotsu", "bọ trĩ"),
    ]),
    ("Sâu", "Nhện đỏ", "ハダニ", [("secure", "nhện đỏ"), ("neem", "nhện đỏ")]),
    ("Sâu", "Bọ nhảy", "ノミハムシ", [("prevathon", "bọ nhảy"), ("prevathon200", "bọ nhảy")]),
    ("Sâu", "Dòi đục lá", "ハモグリバエ", [
        ("prevathon", "dòi đục lá"), ("prevathon200", "dòi đục lá"), ("thiamax", "dòi đục lá"),
    ]),
    ("Sâu", "Ruồi đục lá", "ハモグリバエ", [("neem", "Ruồi đục lá")]),
    ("Sâu", "Vẽ bùa", "ミカンハモグリガ", [("benevia", "vẽ bùa")]),
    ("Sâu", "Rầy nâu", "トビイロウンカ", [
        ("mospilan", "Rầy nâu"), ("jono", "Rầy nâu"), ("actara", "Rầy nâu"), ("dantotsu", "rầy nâu"),
    ]),
    ("Sâu", "Rầy xanh chích hút", "ツマグロヨコバイ", [("jono", "rầy xanh chích hút")]),
    ("Sâu", "Rầy cánh dài", "セジロウンカ", [("thiamax", "Rầy cánh dài")]),
    ("Sâu", "Rầy mềm", "アブラムシ", [("benevia", "Rầy mềm")]),
    ("Sâu", "Rầy phấn trắng", "コナジラミ", [("benevia", "rầy phấn trắng")]),
    ("Sâu", "Rầy phấn", "コナジラミ", [("neem", "rầy phấn")]),
    ("Sâu", "Bọ phấn", "コナジラミ", [("thiamax", "bọ phấn")]),
    ("Sâu", "Rệp sáp", "カイガラムシ", [
        ("permethrin", "Rệp sáp"), ("mospilan", "rệp sáp"), ("neem", "rệp sáp"),
    ]),
    ("Sâu", "Rệp muội", "アブラムシ", [("mospilan", "rệp muội")]),
    ("Sâu", "Rệp", "アブラムシ", [
        ("mikhada", "rệp"), ("anvado", "rệp"), ("actara", "rệp"),
    ]),
    ("Sâu", "Rệp muỗi", "アブラムシ", [("dantotsu", "Rệp muỗi")]),
    ("Sâu", "Rầy (ghi chung)", "ウンカ", [
        ("mospilan", "rầy —"), ("mikhada", "Rầy,"), ("anvado", "Rầy,"),
        ("dantotsu", "rầy,"), ("secsaigon", "rầy"), ("cyrin", "rầy"),
    ]),
    ("Sâu", "Bọ cánh cứng", "甲虫", [("rimon", "bọ cánh cứng")]),
    ("Sâu", "Sâu đất", "土壌害虫", [("diazan", "Sâu đất"), ("makeno", "sâu đất")]),
    ("Sâu", "Côn trùng đất", "土中の害虫", [("diazan", "côn trùng đất")]),
    ("Sâu", "Tuyến trùng", "センチュウ", [
        ("neem", "tuyến trùng"), ("diazan", "tuyến trùng"), ("makeno", "Tuyến trùng"),
    ]),
    ("Sâu", "Kiến", "アリ", [("dantotsu", "kiến")]),
    ("Bệnh", "Phấn trắng", "うどんこ病", [
        ("amistar", "Phấn trắng"), ("kimono", "phấn trắng"), ("acti", "phấn trắng"), ("kanaka", "Phấn trắng"),
    ]),
    ("Bệnh", "Mốc phấn trắng", "うどんこ病", [("metaxyl", "mốc phấn trắng")]),
    ("Bệnh", "Đốm lá", "斑点病", [
        ("amistar", "đốm lá"), ("kimono", "đốm lá"), ("kanaka", "đốm lá"), ("viroval", "đốm lá"),
    ]),
    ("Bệnh", "Thán thư", "炭疽病", [
        ("amistar", "thán thư"), ("kimono", "Thán thư"), ("coc", "thán thư"),
        ("acti", "thán thư"), ("kanaka", "thán thư"), ("viroval", "thán thư"),
    ]),
    ("Bệnh", "Sương mai", "べと病", [
        ("amistar", "sương mai"), ("ranman", "Sương mai"), ("metaxyl", "sương mai"),
        ("insuran", "Sương mai"), ("phytocide", "Sương mai"), ("eddy", "Sương mai"),
        ("cylen", "Sương mai"), ("acti", "Sương mai"),
    ]),
    ("Bệnh", "Giả sương mai", "べと病（類似）", [("cylen", "giả sương mai")]),
    ("Bệnh", "Đốm vòng", "輪紋病", [("amistar", "đốm vòng")]),
    ("Bệnh", "Khô vằn", "紋枯病", [("amistar", "khô vằn")]),
    ("Bệnh", "Đốm nâu", "褐斑病", [("amistar", "đốm nâu")]),
    ("Bệnh", "Mốc sương", "疫病", [
        ("amistar", "mốc sương"), ("ranman", "mốc sương"), ("insuran", "mốc sương"),
        ("phytocide", "mốc sương"), ("eddy", "mốc sương"),
    ]),
    ("Bệnh", "Lở cổ rễ", "苗立枯病", [("amistar", "lở cổ rễ"), ("metaxyl", "lở cổ rễ")]),
    ("Bệnh", "Héo rũ", "立枯病", [("ranman", "héo rũ")]),
    ("Bệnh", "Thối gốc", "株腐れ", [
        ("metaxyl", "Thối gốc"), ("insuran", "thối gốc"), ("phytocide", "thối gốc"), ("eddy", "thối gốc"),
    ]),
    ("Bệnh", "Phytophthora", "疫病菌", [("cylen", "Phytophthora")]),
    ("Bệnh", "Cháy lá vi khuẩn", "細菌性葉焼病", [("coc", "Cháy lá vi khuẩn")]),
    ("Bệnh", "Loét vi khuẩn", "かいよう病", [("coc", "loét vi khuẩn")]),
    ("Bệnh", "Thối nhũn", "軟腐病", [("viroval", "Thối nhũn")]),
    ("Bệnh", "Nấm đất trên cổ rễ", "株元の土壌病害", [("viroval", "nấm đất trên cổ rễ")]),
    ("Bệnh", "Nứt dây chảy nhựa", "つる割病", [("acti", "nứt dây chảy nhựa")]),
]

REMOVED = {
    "petroleum_oil": "SK ENSPRAY 99% EC",
    "lambda_cyhalothrin": "Icon 2.5EC",
}

T = {
    "vi": {
        "file": "Kiem-tra-BVTV-tieng-Viet.xlsx",
        "tabs": ["Đọc trước", "Sâu bệnh - bảng", "Sâu bệnh - câu gốc", "Cấm theo cây - bảng", "Cấm theo cây - danh sách", "Tỷ lệ pha"],
        "title": "Hồ sơ kiểm tra thông tin app Sổ pha thuốc BVTV",
        "intro": [
            "File này chép lại đúng thông tin đang có trong app, để đối chiếu. Không thêm khuyến cáo mới và không thay nhãn trên bao bì.",
            "Có ba phần: (1) sâu bệnh mà app ghi trên từng thuốc, (2) thuốc app không cho dùng trên từng cây, (3) tỷ lệ pha và liều app đang ghi.",
            "Dấu ● ở bảng sâu bệnh chỉ có nghĩa: câu Đối tượng của thuốc có nhắc tên sâu hoặc bệnh đó. Ô trống nghĩa là app không nhắc. Ô trống không có nghĩa là thuốc không trị được.",
            "Chữ Cấm nghĩa là app chặn thuốc vì hoạt chất nằm trong danh sách cấm của cây. Ô trống nghĩa là app không chặn. Ô trống không có nghĩa là thuốc đã được đăng ký cho cây đó.",
            "Cột Số thuốc cấm đếm giống app: mở Bộ tra pha, chọn cây, đếm số thuốc bị làm mờ, rồi so với cột này.",
            "Ở sheet Tỷ lệ pha, dòng tô đỏ là các con số trong app không cùng một tỷ lệ. Dòng tô vàng là app chưa có đủ số để đối chiếu — phải đọc nhãn.",
            "Ba thuốc đã bỏ khỏi app, không có cột trong các bảng: Daconil 500SC, SK ENSPRAY 99% EC, Icon 2.5EC.",
            "Cuối sheet danh sách cấm có các hoạt chất app vẫn ghi cấm trên một số cây, nhưng không còn chai nào trong app.",
            "Cột Kết quả kiểm để trống cho người đọc điền: Đúng, Sai, hoặc Cần sửa.",
        ],
        "legend_pest": "● = câu Đối tượng có nhắc    ô trống = app không nhắc",
        "legend_ban": "Cấm = app không cho chọn thuốc này trên cây    ô trống = app không chặn",
        "kind": {"tru-sau": "Trừ sâu / rầy", "tru-benh": "Trừ bệnh"},
        "bio": "Sinh học",
        "chem": "Hóa học",
        "group": "Nhóm",
        "pest": "Sâu / bệnh",
        "pest_other": "Tên tiếng Nhật",
        "count": "Số thuốc",
        "stt": "STT",
        "name": "Tên thuốc",
        "form": "Dạng",
        "ai": "Hoạt chất",
        "targets": "Đối tượng — nguyên văn trong app",
        "crop_text": "Cây trồng — nguyên văn trong app",
        "split": "Đã tách vào bảng sâu bệnh",
        "miss": "Cụm trong câu chưa thấy ở bảng",
        "check": "Kết quả kiểm",
        "note_user": "Ghi chú người kiểm",
        "crop": "Cây",
        "crop_other": "Tên tiếng Nhật",
        "nban": "Số thuốc cấm",
        "why": "Vì hoạt chất",
        "ban": "Cấm",
        "pack": "Chai / gói",
        "phi": "Cách ly",
        "per16": "Liều app ghi cho bình 16 L",
        "per1000": "Liều app ghi cho 1000 m²",
        "ratio_app": "Tỷ lệ trong bảng pha của app",
        "thin": "Tỷ lệ nhạt nhất",
        "thick": "Tỷ lệ đậm nhất",
        "amt": "Lượng gợi ý cho 16 L theo tỷ lệ",
        "amt_thin": "Lượng nhạt nhất / 16 L",
        "amt_thick": "Lượng đậm nhất / 16 L",
        "from16": "Tỷ lệ suy ra từ liều 16 L",
        "from1000": "Tỷ lệ suy ra từ liều 1000 m²",
        "from_note": "Tỷ lệ ghi trong câu chú thích",
        "note": "Chú thích nguyên văn trong app",
        "status": "Đối chiếu các con số",
        "spray_no": "Không pha bình phun",
        "ok": "Khớp",
        "bad": "Lệch — cần kiểm",
        "gap": "Chưa đủ số để đối chiếu",
        "choices": '"Đúng,Sai,Cần sửa"',
        "orphan_title": "Hoạt chất app vẫn ghi cấm, nhưng không còn chai nào trong app",
        "orphan_h": ["Cây", "Tên tiếng Nhật", "Hoạt chất app còn ghi cấm", "Chai đã bỏ khỏi app"],
        "removed_note": "Đã bỏ khỏi app",
        "how_ratio": "1:N nghĩa là 1 g hoặc 1 ml thuốc trong N ml nước. N càng nhỏ thì thuốc càng đậm. Lượng cho bình 16 L = 16000 ÷ N. Liều 16 L làm tròn (ví dụ 10,7 ml) có thể suy ra 1:1495 thay vì 1:1500 — cột đối chiếu vẫn ghi Khớp. Chỉ dòng đỏ là các nguồn số không cùng tỷ lệ.",
        "section_insect": "SÂU, RẦY, NHỆN",
        "section_disease": "BỆNH",
    },
    "ja": {
        "file": "Kiem-tra-BVTV-tieng-Nhat.xlsx",
        "tabs": ["読み方", "病害虫と薬剤", "病害虫の原文", "作物別使用禁止", "使用禁止リスト", "希釈倍率"],
        "title": "農薬混用アプリの情報確認表",
        "intro": [
            "このファイルは、アプリに入っている情報をそのまま写したものです。新しい推奨は足していません。包装ラベルが優先です。",
            "三つの部分があります。(1) 各薬剤の対象病害虫、(2) 作物ごとに使えない薬剤、(3) 希釈倍率と薬量。",
            "病害虫の表の ● は、その薬剤の「対象」の文にその名前があるという意味です。空欄は、アプリが書いていないという意味です。効かないという意味ではありません。",
            "「禁止」は、その作物の使用禁止有効成分に当たるため、アプリが選べなくしている印です。空欄はアプリが止めていないという意味です。その作物に登録済みという意味ではありません。",
            "「禁止の数」はアプリと同じ数え方です。混用確認で作物を選び、薄く表示された薬剤の数と比べてください。",
            "希釈の表で赤い行は、アプリ内の数字が同じ倍率になっていません。黄色い行は、比べられる数字がまだありません。ラベルを読んでください。",
            "アプリから外した3剤は表に列がありません：Daconil 500SC、SK ENSPRAY 99% EC、Icon 2.5EC。",
            "使用禁止リストの末尾に、作物側の禁止は残っているが、アプリに該当する瓶がない有効成分を載せています。",
            "「確認結果」列は空欄です。正しい、誤り、要修正 を記入できます。",
        ],
        "legend_pest": "● = 対象の文に記載    空欄 = アプリに記載なし",
        "legend_ban": "禁止 = アプリでこの作物に選べない    空欄 = アプリは止めていない",
        "kind": {"tru-sau": "殺虫・ウンカ", "tru-benh": "殺菌"},
        "bio": "生物農薬",
        "chem": "化学農薬",
        "group": "区分",
        "pest": "病害虫",
        "pest_other": "アプリのベトナム語",
        "count": "薬剤数",
        "stt": "番号",
        "name": "薬剤名",
        "form": "剤型",
        "ai": "有効成分",
        "targets": "対象 — アプリの原文",
        "crop_text": "作物 — アプリの原文",
        "split": "病害虫の表へ分けた項目",
        "miss": "原文にあるが表に未掲載",
        "check": "確認結果",
        "note_user": "確認者のメモ",
        "crop": "作物",
        "crop_other": "ベトナム語",
        "nban": "禁止の数",
        "why": "理由となる有効成分",
        "ban": "禁止",
        "pack": "瓶・袋",
        "phi": "収穫前日数",
        "per16": "アプリに記載の16 Lタンク薬量",
        "per1000": "アプリに記載の1000 m²薬量",
        "ratio_app": "アプリの希釈表の倍率",
        "thin": "最も薄い倍率",
        "thick": "最も濃い倍率",
        "amt": "倍率から計算した16 Lの目安",
        "amt_thin": "最も薄い量 / 16 L",
        "amt_thick": "最も濃い量 / 16 L",
        "from16": "16 L薬量から逆算した倍率",
        "from1000": "1000 m²薬量から逆算した倍率",
        "from_note": "注記の文に書かれた倍率",
        "note": "アプリの注記原文",
        "status": "数字の照合",
        "spray_no": "散布タンクには入れない",
        "ok": "一致",
        "bad": "不一致 — 要確認",
        "gap": "照合できる数字が不足",
        "choices": '"正しい,誤り,要修正"',
        "orphan_title": "作物の禁止リストには残っているが、アプリに該当する瓶がない有効成分",
        "orphan_h": ["作物", "ベトナム語", "アプリがまだ禁止している有効成分", "アプリから外した瓶"],
        "removed_note": "アプリから削除済み",
        "how_ratio": "1:N は、N mlの水に薬剤1 gまたは1 mlです。Nが小さいほど濃くなります。16 Lの量 = 16000 ÷ N。16 L薬量の四捨五入（例 10.7 ml）では 1:1495 のように出て、1:1500 と数単位ずれることがあります。照合列はそれでも「一致」です。赤い行だけ、元の数字同士が違う倍率です。",
        "section_insect": "害虫・ウンカ・ハダニ",
        "section_disease": "病気",
    },
}


def load_app():
    script = r"""
const fs = require("fs");
const vm = require("vm");
const c = { window: {} };
vm.createContext(c);
vm.runInContext(fs.readFileSync("js/data.js", "utf8"), c);
vm.runInContext(fs.readFileSync("js/i18n.js", "utf8"), c);
const B = c.window.BVTV;
const ja = c.window.BVTV_I18N.ja;
const out = {
  products: B.PRODUCTS.map((p) => ({
    id: p.id, name: p.name, form: p.form, kind: p.kind, bio: !!p.bio,
    ai: p.ai, group: p.group, pack: p.pack || "",
    targets: p.targets, crops: p.crops,
    per16: p.dose.per16 || "", per1000: p.dose.per1000 || "",
    note: (p.dose && p.dose.note) || "", phi: p.phi || "",
    dilution: p.dose.dilution || null, aiKeys: p.aiKeys || [],
    mixStep: B.formByCode[p.form].mixStep,
    ja: ja.products[p.id] || {}
  })),
  crops: B.CROPS.map((c0) => ({ id: c0.id, name: c0.name, ja: c0.ja, group: c0.group, bannedAis: c0.bannedAis })),
  groups: B.CROP_GROUPS,
  aiLabel: B.AI_LABEL,
  jaAi: ja.ai
};
process.stdout.write(JSON.stringify(out));
"""
    raw = subprocess.check_output(["node", "-e", script], cwd=ROOT)
    return json.loads(raw.decode("utf-8"))


def parse_num(text):
    return float(str(text).replace(",", "."))


def fmt_ratio(n):
    if n is None:
        return ""
    return "1:" + str(int(round(n)))


def fmt_amt(n, lang):
    if n is None:
        return ""
    x = round(n * 100) / 100
    if x < 10:
        s = f"{x:.1f}".rstrip("0").rstrip(".")
    else:
        s = str(int(round(x)))
    return s.replace(".", ",") if lang == "vi" else s


def find_amount(text):
    import re
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(g|ml)\b", text or "", re.I)
    if not m:
        return None, None
    return parse_num(m.group(1)), m.group(2).lower()


def find_per1000(text):
    import re
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(g|ml)\s*/\s*(\d+(?:[.,]\d+)?)\s*l", text or "", re.I)
    if not m:
        return None
    amount = parse_num(m.group(1))
    liters = parse_num(m.group(3))
    if amount <= 0:
        return None
    return (liters * 1000) / amount


def find_note_ratio(text):
    import re
    m = re.search(r"pha\s*~?\s*1\s*:\s*(\d+(?:[.,]\d+)?)", text or "", re.I)
    if not m:
        m = re.search(r"希釈\s*~?\s*1\s*:\s*(\d+(?:[.,]\d+)?)", text or "", re.I)
    if not m:
        return None
    return parse_num(m.group(1))


def close(a, b):
    if a is None or b is None:
        return True
    return abs(a - b) <= max(0.08 * max(a, b), 30)


def dose_row(p, lang):
    t = T[lang]
    dil = p["dilution"]
    per16_amt, _unit = find_amount(p["per16"])
    ratio16 = (16000 / per16_amt) if per16_amt else None
    ratio1000 = find_per1000(p["per1000"])
    ratio_note = find_note_ratio(p["note"] if lang == "vi" else (p["ja"].get("doseNote") or p["note"]))
    sources = []
    if ratio16:
        sources.append(ratio16)
    if ratio1000:
        sources.append(ratio1000)
    if dil:
        sources.append(dil["ratio"])
    if ratio_note:
        sources.append(ratio_note)
    spray = p["mixStep"] > 0
    if not spray:
        status = t["spray_no"]
        level = "gran"
    elif len(sources) < 2:
        status = t["gap"]
        level = "gap"
    elif all(close(sources[0], x) for x in sources[1:]):
        status = t["ok"]
        level = "ok"
    else:
        status = t["bad"]
        level = "bad"
    suggest = thin_a = thick_a = None
    ratio = thin = thick = ""
    if dil:
        ratio = fmt_ratio(dil["ratio"])
        thick_n = min(dil["upper"], dil["lower"])
        thin_n = max(dil["upper"], dil["lower"])
        thin = fmt_ratio(thin_n)
        thick = fmt_ratio(thick_n)
        suggest = 16000 / dil["ratio"]
        thin_a = 16000 / thin_n
        thick_a = 16000 / thick_n
        unit = dil["unit"]
    else:
        unit = ""
    ja = p["ja"]
    if lang == "ja":
        per16 = ja.get("per16") or str(p["per16"]).replace(",", ".")
        per1000 = ja.get("per1000") or str(p["per1000"]).replace(" lít nước", " L").replace(",", ".")
        note = ja.get("doseNote") or p["note"]
        phi = ja.get("phi") or p["phi"]
    else:
        per16, per1000, note, phi = p["per16"], p["per1000"], p["note"], p["phi"]
    return {
        "per16": per16,
        "per1000": per1000,
        "note": note,
        "phi": phi,
        "ratio": ratio,
        "thin": thin if dil and thin != thick else ("—" if dil else ""),
        "thick": thick if dil and thin != thick else ("—" if dil else ""),
        "amt": (fmt_amt(suggest, lang) + " " + unit).strip() if suggest is not None else "",
        "amt_thin": (fmt_amt(thin_a, lang) + " " + unit).strip() if dil and thin != thick else "",
        "amt_thick": (fmt_amt(thick_a, lang) + " " + unit).strip() if dil and thin != thick else "",
        "from16": fmt_ratio(ratio16),
        "from1000": fmt_ratio(ratio1000),
        "from_note": fmt_ratio(ratio_note),
        "status": status,
        "level": level,
    }


thin_border = Border(
    left=Side(style="thin", color="D5DDD6"),
    right=Side(style="thin", color="D5DDD6"),
    top=Side(style="thin", color="D5DDD6"),
    bottom=Side(style="thin", color="D5DDD6"),
)
fill_header = PatternFill("solid", fgColor="1F6B45")
fill_title = PatternFill("solid", fgColor="0F2419")
fill_soft = PatternFill("solid", fgColor="E7F3EB")
fill_ban = PatternFill("solid", fgColor="FDECEA")
fill_ok = PatternFill("solid", fgColor="E6F6EA")
fill_gap = PatternFill("solid", fgColor="FEF3E2")
fill_bad = PatternFill("solid", fgColor="F8D0CB")
fill_gran = PatternFill("solid", fgColor="F3EEE4")
fill_insect = PatternFill("solid", fgColor="E8F0F8")
fill_disease = PatternFill("solid", fgColor="F8E8F4")
fill_white = PatternFill("solid", fgColor="FFFFFF")
fill_check = PatternFill("solid", fgColor="FFFBEB")
GROUP_FILL = {
    "hanh": PatternFill("solid", fgColor="F3EEE4"),
    "la": PatternFill("solid", fgColor="E6F4EF"),
    "cu": PatternFill("solid", fgColor="E8F0F8"),
    "qua": PatternFill("solid", fgColor="F5E9F7"),
}
font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_title = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
font_body = Font(name="Calibri", size=11, color="14211A")
font_small = Font(name="Calibri", size=9, color="14211A")
font_ban = Font(name="Calibri", size=9, bold=True, color="B42318")
font_mark = Font(name="Calibri", size=12, bold=True, color="1F6B45")
center = Alignment(horizontal="center", vertical="center", wrap_text=True)
left_al = Alignment(horizontal="left", vertical="center", wrap_text=True)


def font_for(lang, size=11, bold=False, color="14211A"):
    name = "Yu Gothic" if lang == "ja" else "Calibri"
    return Font(name=name, size=size, bold=bold, color=color)


def apply_font(cell, lang, size=11, bold=False, color="14211A"):
    if lang == "ja":
        cell.font = font_for(lang, size, bold, color)


def write_cover(ws, lang, data):
    t = T[lang]
    ws.sheet_properties.tabColor = "0F2419"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_view.showGridLines = False
    ws.merge_cells("A1:B1")
    ws["A1"] = t["title"]
    ws["A1"].font = Font(name="Yu Gothic" if lang == "ja" else "Calibri", size=18, bold=True, color="FFFFFF")
    ws["A1"].fill = fill_title
    ws["A1"].alignment = Alignment(vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 36
    ws["B1"].fill = fill_title
    for i, line in enumerate(t["intro"], start=3):
        ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=2)
        ws.cell(i, 1, line).alignment = left_al
        ws.cell(i, 1).font = font_for(lang, 12)
        ws.row_dimensions[i].height = 36
    start = 3 + len(t["intro"]) + 1
    ws.cell(start, 1, t["tabs"][1]).font = font_for(lang, 12, True, "1F6B45")
    ws.cell(start + 1, 1, t["legend_pest"]).font = font_for(lang, 11)
    ws.cell(start + 3, 1, t["tabs"][3]).font = font_for(lang, 12, True, "1F6B45")
    ws.cell(start + 4, 1, t["legend_ban"]).font = font_for(lang, 11)
    ws.cell(start + 6, 1, t["how_ratio"]).font = font_for(lang, 11)
    ws.column_dimensions["A"].width = 120
    ws.column_dimensions["B"].width = 30
    ws.oddHeader.left.text = t["title"]
    ws.auto_filter.ref = None
    ws.freeze_panes = "A3"
    ws.sheet_view.zoomScale = 120
    ws.print_title_rows = "1:1"
    # silence unused
    _ = data


def header_row(ws, row, labels, lang):
    for col, label in enumerate(labels, start=1):
        cell = ws.cell(row, col, label)
        cell.fill = fill_header
        cell.font = Font(name="Yu Gothic" if lang == "ja" else "Calibri", size=10, bold=True, color="FFFFFF")
        cell.alignment = center
        cell.border = thin_border
    ws.row_dimensions[row].height = 32
    ws.auto_filter.ref = f"A{row}:{get_column_letter(len(labels))}{row}"
    ws.freeze_panes = f"A{row + 1}"
    ws.auto_filter.ref = f"A{row}:{get_column_letter(len(labels))}{ws.max_row or row}"
    return row


def finish_filter(ws, header, cols, last):
    ws.auto_filter.ref = f"A{header}:{get_column_letter(cols)}{last}"
    ws.freeze_panes = f"B{header + 1}"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.page_setup.horizontalCentered = True
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = f"{header}:{header}"
    ws.page_setup.horizontalDpi = 300
    ws.sheet_view.zoomScale = 110
    ws.oddHeader.center.text = ws.title
    ws.oddFooter.right.text = "Page &P / &N"
    ws.page_margins.left = 0.4
    ws.page_margins.right = 0.4
    ws.page_margins.top = 0.6
    ws.page_margins.bottom = 0.5


def add_check_validation(ws, col, first, last, lang):
    letter = get_column_letter(col)
    dv = DataValidation(type="list", formula1=T[lang]["choices"], allow_blank=True)
    dv.error = "Đúng / Sai / Cần sửa" if lang == "vi" else "正しい / 誤り / 要修正"
    dv.errorTitle = "Kiểm" if lang == "vi" else "確認"
    dv.add(f"{letter}{first}:{letter}{last}")
    ws.add_data_validation(dv)


def pest_links(data):
    by_id = {p["id"]: p for p in data["products"]}
    links = {p["id"]: [] for p in data["products"]}
    for group, vi, ja, hits in PESTS:
        for pid, needle in hits:
            text = by_id[pid]["targets"]
            if needle.lower() not in text.lower():
                raise SystemExit(f"Không thấy '{needle}' trong {pid}: {text}")
            links[pid].append(vi)
    return links


def uncovered_bits(product, linked_names):
    head = product["targets"].split("—")[0]
    parts = [p.strip(" .") for p in head.split(",") if p.strip()]
    missing = []
    for part in parts:
        low = part.lower()
        if any(name.lower() in low or low in name.lower() for name in linked_names):
            continue
        if any(k in low for k in linked_names_needles(product["id"])):
            continue
        missing.append(part)
    return missing


def linked_names_needles(pid):
    out = []
    for _g, _vi, _ja, hits in PESTS:
        for p, needle in hits:
            if p == pid:
                out.append(needle.lower())
    return out


def write_pest_matrix(ws, lang, data):
    t = T[lang]
    ws.sheet_properties.tabColor = "1D4E89"
    products = data["products"]
    labels = [t["group"], t["pest"], t["pest_other"], t["count"]] + [p["name"] for p in products]
    # title
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=4)
    ws["A1"] = t["legend_pest"]
    ws["A1"].font = font_for(lang, 11, True)
    ws["A1"].alignment = left_al
    ws.row_dimensions[1].height = 22
    header = 3
    for col, label in enumerate(labels, start=1):
        cell = ws.cell(header, col, label)
        cell.fill = fill_header
        cell.font = Font(name="Yu Gothic" if lang == "ja" else "Calibri", size=9, bold=True, color="FFFFFF")
        cell.alignment = Alignment(textRotation=90, horizontal="center", vertical="bottom", wrap_text=True) if col > 4 else center
        cell.border = thin_border
    kind_row = 2
    ws.cell(kind_row, 1, "").fill = fill_soft
    for col, p in enumerate(products, start=5):
        cell = ws.cell(kind_row, col, t["kind"][p["kind"]])
        cell.fill = fill_insect if p["kind"] == "tru-sau" else fill_disease
        cell.font = font_for(lang, 8, True)
        cell.alignment = Alignment(textRotation=90, horizontal="center", vertical="bottom")
        cell.border = thin_border
    ws.row_dimensions[header].height = 110
    ws.row_dimensions[kind_row].height = 48
    hit_ids = []
    for group, vi, ja, hits in PESTS:
        hit_ids.append({pid for pid, _n in hits})
    row = header + 1
    current = None
    for (group, vi, ja, hits), ids in zip(PESTS, hit_ids):
        if group != current:
            current = group
            ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=4)
            title = t["section_insect"] if group == "Sâu" else t["section_disease"]
            band = PatternFill("solid", fgColor="1D4E89" if group == "Sâu" else "7A3E6D")
            cell = ws.cell(row, 1, title)
            cell.font = font_for(lang, 11, True, "FFFFFF")
            cell.fill = band
            for col in range(1, 5 + len(products)):
                ws.cell(row, col).fill = band
                ws.cell(row, col).border = thin_border
            row += 1
        name = ja if lang == "ja" else vi
        other = vi if lang == "ja" else ja
        group_name = t["kind"]["tru-sau"] if group == "Sâu" else t["kind"]["tru-benh"]
        values = [group_name, name, other, len(ids)]
        for col, value in enumerate(values, start=1):
            cell = ws.cell(row, col, value)
            cell.font = font_for(lang, 10, col == 2)
            cell.alignment = left_al if col < 4 else center
            cell.border = thin_border
            cell.fill = fill_insect if group == "Sâu" else fill_disease
        for col, p in enumerate(products, start=5):
            cell = ws.cell(row, col, "●" if p["id"] in ids else "")
            cell.alignment = center
            cell.border = thin_border
            cell.font = font_mark
            if p["id"] in ids:
                cell.fill = fill_ok
        ws.row_dimensions[row].height = 20
        row += 1
    last = row - 1
    ws.column_dimensions["A"].width = 18
    ws.column_dimensions["B"].width = 28
    ws.column_dimensions["C"].width = 26
    ws.column_dimensions["D"].width = 12
    for i in range(5, 5 + len(products)):
        ws.column_dimensions[get_column_letter(i)].width = 5
    ws.freeze_panes = "E4"
    ws.auto_filter.ref = f"A{header}:{get_column_letter(4 + len(products))}{last}"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = "1:3"
    ws.print_title_cols = "A:D"
    ws.page_setup.paperSize = ws.PAPERSIZE_A3
    ws.oddFooter.right.text = "Page &P / &N"
    ws.sheet_view.zoomScale = 110


def write_sentences(ws, lang, data, links):
    t = T[lang]
    ws.sheet_properties.tabColor = "1D4E89"
    headers = [t["stt"], t["kind"]["tru-sau"].split(" ")[0] if False else t["group"], t["name"], t["form"], t["ai"], t["targets"], t["crop_text"], t["split"], t["miss"], t["check"], t["note_user"]]
    # group header uses Nhóm
    headers[1] = t["group"]
    ws.merge_cells("A1:K1")
    ws["A1"] = t["legend_pest"]
    ws["A1"].font = font_for(lang, 11, True)
    ws["A1"].alignment = left_al
    header = 3
    for col, label in enumerate(headers, start=1):
        cell = ws.cell(header, col, label)
        cell.fill = fill_header
        cell.font = Font(name="Yu Gothic" if lang == "ja" else "Calibri", size=10, bold=True, color="FFFFFF")
        cell.alignment = center
        cell.border = thin_border
    ws.row_dimensions[header].height = 30
    for i, p in enumerate(data["products"], start=1):
        row = header + i
        ja = p["ja"]
        targets = ja.get("targets") if lang == "ja" and ja.get("targets") else p["targets"]
        crops = ja.get("crops") if lang == "ja" and ja.get("crops") else p["crops"]
        linked = links[p["id"]]
        miss = uncovered_bits(p, linked)
        split = ", ".join(linked)
        miss_text = "; ".join(miss)
        kind = t["kind"][p["kind"]] + (" · " + t["bio"] if p["bio"] else "")
        vals = [i, kind, p["name"], p["form"], p["ai"], targets, crops, split, miss_text, "", ""]
        for col, value in enumerate(vals, start=1):
            cell = ws.cell(row, col, value)
            cell.font = font_for(lang, 10)
            cell.alignment = left_al
            cell.border = thin_border
            if col in (10, 11):
                cell.fill = fill_check
            elif miss_text and col == 9:
                cell.fill = fill_gap
        ws.row_dimensions[row].height = 48
    last = header + len(data["products"])
    widths = [6, 22, 28, 10, 42, 55, 40, 36, 32, 16, 24]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    add_check_validation(ws, 10, header + 1, last, lang)
    finish_filter(ws, header, len(headers), last)
    ws.freeze_panes = "D4"


def banned_products(crop, products):
    found = []
    for p in products:
        keys = [k for k in p["aiKeys"] if k in crop["bannedAis"]]
        if keys:
            found.append((p, keys))
    return found


def write_ban_matrix(ws, lang, data):
    t = T[lang]
    ws.sheet_properties.tabColor = "B42318"
    products = data["products"]
    groups = {g["id"]: g for g in data["groups"]}
    ws.merge_cells("A1:D1")
    ws["A1"] = t["legend_ban"]
    ws["A1"].font = font_for(lang, 11, True)
    ws["A1"].alignment = left_al
    labels = [t["group"], t["crop"], t["crop_other"], t["nban"]] + [p["name"] for p in products]
    header = 3
    kind_row = 2
    for col, label in enumerate(labels, start=1):
        cell = ws.cell(header, col, label)
        cell.fill = fill_header
        cell.font = Font(name="Yu Gothic" if lang == "ja" else "Calibri", size=9, bold=True, color="FFFFFF")
        cell.alignment = Alignment(textRotation=90, horizontal="center", vertical="bottom", wrap_text=True) if col > 4 else center
        cell.border = thin_border
    for col, p in enumerate(products, start=5):
        cell = ws.cell(kind_row, col, t["kind"][p["kind"]])
        cell.fill = fill_insect if p["kind"] == "tru-sau" else fill_disease
        cell.font = font_for(lang, 8, True)
        cell.alignment = Alignment(textRotation=90, horizontal="center", vertical="bottom")
        cell.border = thin_border
    ws.row_dimensions[header].height = 110
    ws.row_dimensions[kind_row].height = 48
    for r, crop in enumerate(data["crops"]):
        row = header + 1 + r
        hits = banned_products(crop, products)
        banned_ids = {p["id"] for p, _k in hits}
        g = groups[crop["group"]]
        gname = g["ja"] if lang == "ja" else g["name"]
        cname = crop["ja"] if lang == "ja" else crop["name"]
        other = crop["name"] if lang == "ja" else crop["ja"]
        vals = [gname, cname, other, len(hits)]
        base = GROUP_FILL[crop["group"]]
        for col, value in enumerate(vals, start=1):
            cell = ws.cell(row, col, value)
            cell.font = font_for(lang, 10, col in (2, 4))
            cell.alignment = left_al if col < 4 else center
            cell.border = thin_border
            cell.fill = base
        for col, p in enumerate(products, start=5):
            on = p["id"] in banned_ids
            cell = ws.cell(row, col, t["ban"] if on else "")
            cell.alignment = center
            cell.border = thin_border
            cell.fill = fill_ban if on else fill_white
            cell.font = font_ban if on else font_small
        ws.row_dimensions[row].height = 20
    last = header + len(data["crops"])
    ws.column_dimensions["A"].width = 24
    ws.column_dimensions["B"].width = 26
    ws.column_dimensions["C"].width = 22
    ws.column_dimensions["D"].width = 14
    for i in range(5, 5 + len(products)):
        ws.column_dimensions[get_column_letter(i)].width = 5.2
    ws.freeze_panes = "E4"
    ws.auto_filter.ref = f"A{header}:{get_column_letter(4 + len(products))}{last}"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A3
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = "1:3"
    ws.print_title_cols = "A:D"
    ws.oddFooter.right.text = "Page &P / &N"
    ws.sheet_view.zoomScale = 110


def write_ban_list(ws, lang, data):
    t = T[lang]
    ws.sheet_properties.tabColor = "B42318"
    groups = {g["id"]: g for g in data["groups"]}
    headers = [t["stt"], t["group"], t["crop"], t["crop_other"], t["nban"], t["name"], t["form"], t["ai"], t["why"], t["check"], t["note_user"]]
    ws.merge_cells("A1:K1")
    ws["A1"] = t["legend_ban"]
    ws["A1"].font = font_for(lang, 11, True)
    ws["A1"].alignment = left_al
    header = 3
    for col, label in enumerate(headers, start=1):
        cell = ws.cell(header, col, label)
        cell.fill = fill_header
        cell.font = Font(name="Yu Gothic" if lang == "ja" else "Calibri", size=10, bold=True, color="FFFFFF")
        cell.alignment = center
        cell.border = thin_border
    row = header + 1
    stt = 1
    for crop in data["crops"]:
        hits = banned_products(crop, products := data["products"])
        g = groups[crop["group"]]
        for p, keys in hits:
            why = " + ".join((data["jaAi"] if lang == "ja" else data["aiLabel"]).get(k, k) for k in keys)
            gname = g["ja"] if lang == "ja" else g["name"]
            cname = crop["ja"] if lang == "ja" else crop["name"]
            other = crop["name"] if lang == "ja" else crop["ja"]
            vals = [stt, gname, cname, other, len(hits), p["name"], p["form"], p["ai"], why, "", ""]
            for col, value in enumerate(vals, start=1):
                cell = ws.cell(row, col, value)
                cell.font = font_for(lang, 10)
                cell.alignment = left_al
                cell.border = thin_border
                cell.fill = fill_ban if col == 6 else (fill_check if col >= 10 else GROUP_FILL[crop["group"]])
            ws.row_dimensions[row].height = 22
            stt += 1
            row += 1
    last_ban = row - 1
    add_check_validation(ws, 10, header + 1, max(last_ban, header + 1), lang)
    row += 2
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=4)
    cell = ws.cell(row, 1, t["orphan_title"])
    cell.font = font_for(lang, 12, True, "FFFFFF")
    cell.fill = PatternFill("solid", fgColor="7A4E12")
    for col in range(1, 5):
        ws.cell(row, col).fill = PatternFill("solid", fgColor="7A4E12")
    row += 1
    for col, label in enumerate(t["orphan_h"], start=1):
        c = ws.cell(row, col, label)
        c.fill = fill_gap
        c.font = font_for(lang, 10, True)
        c.border = thin_border
        c.alignment = center
    row += 1
    known = {k for p in data["products"] for k in p["aiKeys"]}
    for crop in data["crops"]:
        for key in crop["bannedAis"]:
            if key in known:
                continue
            gname = crop["ja"] if lang == "ja" else crop["name"]
            other = crop["name"] if lang == "ja" else crop["ja"]
            label = (data["jaAi"] if lang == "ja" else data["aiLabel"]).get(key, key)
            bottle = REMOVED.get(key, "")
            vals = [gname, other, label, bottle + " — " + t["removed_note"]]
            for col, value in enumerate(vals, start=1):
                c = ws.cell(row, col, value)
                c.font = font_for(lang, 10)
                c.fill = fill_gap
                c.border = thin_border
                c.alignment = left_al
            row += 1
    widths = [6, 24, 24, 18, 12, 28, 10, 42, 46, 16, 24]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    finish_filter(ws, header, len(headers), last_ban)
    ws.freeze_panes = "F4"


def write_dose(ws, lang, data):
    t = T[lang]
    ws.sheet_properties.tabColor = "B45309"
    headers = [
        t["stt"], t["group"], t["name"], t["form"], t["pack"], t["per16"], t["per1000"],
        t["ratio_app"], t["thin"], t["thick"], t["amt"], t["amt_thin"], t["amt_thick"],
        t["from16"], t["from1000"], t["from_note"], t["phi"], t["note"], t["status"],
        t["check"], t["note_user"],
    ]
    ws.merge_cells("A1:U1")
    ws["A1"] = t["how_ratio"]
    ws["A1"].font = font_for(lang, 11, True)
    ws["A1"].alignment = left_al
    ws.row_dimensions[1].height = 32
    header = 3
    for col, label in enumerate(headers, start=1):
        cell = ws.cell(header, col, label)
        cell.fill = fill_header
        cell.font = Font(name="Yu Gothic" if lang == "ja" else "Calibri", size=9, bold=True, color="FFFFFF")
        cell.alignment = center
        cell.border = thin_border
    ws.row_dimensions[header].height = 36
    fills = {"ok": fill_ok, "bad": fill_bad, "gap": fill_gap, "gran": fill_gran}
    for i, p in enumerate(data["products"], start=1):
        row = header + i
        d = dose_row(p, lang)
        kind = t["kind"][p["kind"]] + (" · " + t["bio"] if p["bio"] else "")
        vals = [
            i, kind, p["name"], p["form"], p["pack"], d["per16"], d["per1000"],
            d["ratio"], d["thin"], d["thick"], d["amt"], d["amt_thin"], d["amt_thick"],
            d["from16"], d["from1000"], d["from_note"], d["phi"], d["note"], d["status"], "", "",
        ]
        for col, value in enumerate(vals, start=1):
            cell = ws.cell(row, col, value)
            cell.font = font_for(lang, 10, col == 19)
            cell.alignment = center if col in (1, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16) else left_al
            cell.border = thin_border
            if col in (20, 21):
                cell.fill = fill_check
            elif col == 19:
                cell.fill = fills[d["level"]]
            elif d["level"] == "bad":
                cell.fill = PatternFill("solid", fgColor="FFF6F5")
        ws.row_dimensions[row].height = 36
    last = header + len(data["products"])
    widths = [6, 22, 28, 8, 12, 28, 22, 18, 16, 16, 18, 16, 16, 18, 20, 20, 22, 55, 28, 16, 24]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    add_check_validation(ws, 20, header + 1, last, lang)
    finish_filter(ws, header, len(headers), last)
    ws.freeze_panes = "D4"


def build(lang, data, links):
    wb = Workbook()
    t = T[lang]
    sheets = [
        ("cover", t["tabs"][0]),
        ("pest", t["tabs"][1]),
        ("sent", t["tabs"][2]),
        ("matrix", t["tabs"][3]),
        ("list", t["tabs"][4]),
        ("dose", t["tabs"][5]),
    ]
    ws0 = wb.active
    ws0.title = sheets[0][1]
    write_cover(ws0, lang, data)
    writers = {
        "pest": lambda ws: write_pest_matrix(ws, lang, data),
        "sent": lambda ws: write_sentences(ws, lang, data, links),
        "matrix": lambda ws: write_ban_matrix(ws, lang, data),
        "list": lambda ws: write_ban_list(ws, lang, data),
        "dose": lambda ws: write_dose(ws, lang, data),
    }
    for key, title in sheets[1:]:
        ws = wb.create_sheet(title)
        writers[key](ws)
    path = ROOT / t["file"]
    wb.save(path)
    return path


def main():
    data = load_app()
    links = pest_links(data)
    problems = []
    for p in data["products"]:
        miss = uncovered_bits(p, links[p["id"]])
        if miss:
            problems.append(p["id"] + ": " + "; ".join(miss))
    if problems:
        raise SystemExit("Cụm chưa gắn vào bảng sâu bệnh:\n" + "\n".join(problems))
    paths = [build("vi", data, links), build("ja", data, links)]
    bad = []
    for p in data["products"]:
        d = dose_row(p, "vi")
        if d["level"] == "bad":
            bad.append(f"{p['name']}: 16L {d['from16']} | 1000m2 {d['from1000']} | table {d['ratio']} | note {d['from_note']}")
    print("CREATED")
    for path in paths:
        print(path.name)
    if bad:
        print("MISMATCH")
        for line in bad:
            print("-", line)


if __name__ == "__main__":
    main()
