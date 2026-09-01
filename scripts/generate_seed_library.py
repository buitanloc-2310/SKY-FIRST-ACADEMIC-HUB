from pathlib import Path
import csv, json, hashlib, re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import mm

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'seed-library'/'pdfs'
OUT.mkdir(parents=True,exist_ok=True)
LOGO=ROOT/'public'/'assets'/'skyfirst-logo-print.jpg'
INSTANCE='bc5bc5f5-b089-4102-a812-3b2666a802af'
COPY='@ Bản quyền thuộc Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN)'
YEAR=2026
pdfmetrics.registerFont(TTFont('TimesNewRoman','/usr/share/fonts/truetype/croscore/Tinos-Regular.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-Bold','/usr/share/fonts/truetype/croscore/Tinos-Bold.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRoman-Italic','/usr/share/fonts/truetype/croscore/Tinos-Italic.ttf'))

DOMAINS={
'ENG':('Tiếng Anh','field_english','Tiếng Anh',[
'Các thì cơ bản trong tiếng Anh','Hiện tại đơn và thói quen','Hiện tại tiếp diễn và hành động đang diễn ra','Quá khứ đơn và kể chuyện','Quá khứ tiếp diễn trong ngữ cảnh','Hiện tại hoàn thành và trải nghiệm','Tương lai với will và be going to','Động từ khuyết thiếu cơ bản','Câu điều kiện loại 0 và loại 1','Câu điều kiện loại 2','Câu bị động cơ bản','Câu tường thuật cơ bản','Mệnh đề quan hệ xác định','So sánh hơn và so sánh nhất','Danh từ đếm được và không đếm được','Mạo từ a an the','Giới từ chỉ thời gian và nơi chốn','Liên từ và từ nối','Cấu trúc câu hỏi tiếng Anh','Viết đoạn văn có câu chủ đề']),
'COM':('Giao tiếp','field_languages','Ngôn ngữ',[
'Lắng nghe chủ động','Đặt câu hỏi mở','Phản hồi mang tính xây dựng','Giao tiếp rõ ràng trong nhóm','Giới thiệu bản thân chuyên nghiệp','Trình bày ý kiến ngắn gọn','Xử lý bất đồng trong giao tiếp','Giao tiếp qua email học thuật','Giao tiếp trong họp trực tuyến','Kỹ thuật tóm tắt ý chính','Giao tiếp liên văn hóa cơ bản','Ngôn ngữ cơ thể phù hợp','Kỹ thuật thuyết phục có đạo đức','Phản biện ý tưởng thay vì con người','Ghi nhận và xác nhận thông tin','Giao tiếp khi làm việc nhóm','Chuẩn bị câu hỏi phỏng vấn','Phát biểu trước nhóm nhỏ','Giao tiếp với đối tác cộng đồng','Xây dựng thông điệp dễ hiểu']),
'STD':('Kỹ năng học tập','field_study','Kỹ năng học tập',[
'Lập kế hoạch học tập tuần','Kỹ thuật Pomodoro hợp lý','Ghi chú theo phương pháp Cornell','Ôn tập ngắt quãng','Thực hành truy hồi kiến thức','Đọc chủ động tài liệu học thuật','Xác định mục tiêu SMART cho học tập','Quản lý thời gian trước kỳ thi','Xây dựng môi trường học tập tập trung','Tự đánh giá tiến độ học tập','Tóm tắt một chương sách','Lập bản đồ khái niệm','Chia nhỏ nhiệm vụ phức tạp','Học từ sai sót','Chuẩn bị trước buổi học','Ôn tập sau buổi học','Quản lý tài liệu số cá nhân','Đặt câu hỏi khi chưa hiểu','Học theo dự án nhỏ','Duy trì nhật ký học tập']),
'RES':('Nghiên cứu','field_research','Nghiên cứu',[
'Xác định câu hỏi nghiên cứu','Phân biệt nguồn sơ cấp và thứ cấp','Tìm kiếm từ khóa học thuật','Đánh giá độ tin cậy của nguồn','Ghi chép nguồn tham khảo','Tránh đạo văn trong học thuật','Paraphrase có trách nhiệm','Tóm tắt nghiên cứu','Thiết kế bảng hỏi cơ bản','Chọn mẫu khảo sát cơ bản','Khái niệm biến trong nghiên cứu','Dữ liệu định tính và định lượng','Đọc biểu đồ và bảng số liệu','Viết mục tiêu nghiên cứu','Xây dựng khung nội dung báo cáo','Giới hạn và phạm vi nghiên cứu','Trình bày kết quả khảo sát','Viết kết luận dựa trên bằng chứng','Kiểm tra tính nhất quán của dữ liệu','Đạo đức nghiên cứu cơ bản']),
'VOL':('Tình nguyện & cộng đồng','field_community','Phát triển cộng đồng',[
'Nguyên tắc tham gia tình nguyện','Xác định nhu cầu cộng đồng','Lập kế hoạch hoạt động nhỏ','Phân công tình nguyện viên','An toàn trong hoạt động cộng đồng','Bảo vệ dữ liệu người tham gia','Giao tiếp với người hưởng lợi','Tôn trọng sự đa dạng cộng đồng','Theo dõi đầu việc tình nguyện','Đánh giá sau hoạt động','Quản lý vật tư hoạt động','Tổ chức buổi sinh hoạt cộng đồng','Xây dựng quy tắc ứng xử','Tiếp nhận phản hồi cộng đồng','Phối hợp với đơn vị địa phương','Ghi nhận đóng góp tình nguyện viên','Quản lý rủi ro sự kiện nhỏ','Truyền thông có trách nhiệm','Bảo vệ người chưa thành niên','Báo cáo kết quả hoạt động']),
'PRJ':('Quản trị dự án','field_management','Quản trị dự án & tổ chức',[
'Xác định phạm vi dự án','Lập danh sách công việc','Phân công trách nhiệm RACI cơ bản','Xây dựng mốc tiến độ','Theo dõi rủi ro dự án','Quản lý thay đổi phạm vi','Họp dự án hiệu quả','Biên bản họp ngắn gọn','Quản lý tài liệu dự án','Đặt chỉ số kết quả cơ bản','Theo dõi ngân sách phi thương mại','Quản lý phụ thuộc giữa công việc','Đánh giá ưu tiên nhiệm vụ','Xử lý công việc chậm tiến độ','Bàn giao nhiệm vụ','Tổng kết dự án','Quản lý phiên bản tài liệu','Phân quyền truy cập nội bộ','Xây dựng quy trình phê duyệt','Lưu trữ hồ sơ dự án']),
'DIG':('Năng lực số','field_digital','Năng lực số',[
'Mật khẩu mạnh và trình quản lý mật khẩu','Xác thực đa yếu tố','Nhận diện email lừa đảo','Quản lý quyền riêng tư trực tuyến','Sao lưu dữ liệu cơ bản','Đặt tên file và thư mục khoa học','Kiểm tra nguồn tin trên mạng','Tìm kiếm web hiệu quả','Quản lý phiên bản tài liệu số','Chia sẻ file an toàn','Phân quyền truy cập tệp','Nhận diện liên kết đáng ngờ','Cập nhật phần mềm an toàn','Bảo vệ thiết bị dùng chung','Dữ liệu tối thiểu cần thu thập','Quyền riêng tư theo vai trò','Nhật ký hoạt động hệ thống','Kiểm tra tính toàn vẹn file bằng hash','Lưu trữ đám mây có tổ chức','Ứng xử có trách nhiệm trên mạng']),
'MED':('Truyền thông','field_digital','Năng lực số',[
'Xác định đối tượng truyền thông','Viết tiêu đề rõ ràng','Xây dựng thông điệp chính','Lập lịch nội dung cơ bản','Kiểm tra thông tin trước khi đăng','Sử dụng hình ảnh có quyền phù hợp','Ghi nguồn nội dung','Viết chú thích ảnh','Tóm tắt sự kiện cho fanpage','Quản lý phản hồi bình luận','Xử lý thông tin sai lệch','Thiết kế bài đăng dễ đọc','Phân biệt thông tin và quảng cáo','Bảo vệ dữ liệu trong truyền thông','Xin phép trước khi công khai hình ảnh','Tạo checklist duyệt bài','Theo dõi hiệu quả nội dung','Lưu trữ tài sản truyền thông','Phối hợp nội dung đa kênh','Đánh giá rủi ro danh tiếng']),
'LDR':('Lãnh đạo & đội nhóm','field_management','Quản trị dự án & tổ chức',[
'Phân công theo năng lực','Thiết lập kỳ vọng rõ ràng','Phản hồi một-một hiệu quả','Trao quyền có kiểm soát','Theo dõi cam kết công việc','Giải quyết xung đột nhóm','Khuyến khích thành viên phát biểu','Ra quyết định dựa trên thông tin','Phân biệt khẩn cấp và quan trọng','Xây dựng quy tắc nhóm','Ghi nhận đóng góp công bằng','Chuyển giao vai trò','Kèm cặp thành viên mới','Tổ chức retrospective','Quản lý cuộc họp','Xử lý thiếu thông tin','Xây dựng văn hóa trách nhiệm','Bảo vệ ranh giới vai trò','Phối hợp giữa nhiều đơn vị','Duy trì tri thức tổ chức']),
'PRE':('Thuyết trình','field_study','Kỹ năng học tập',[
'Xác định mục tiêu bài thuyết trình','Cấu trúc mở thân kết','Thiết kế slide ít chữ','Dùng ví dụ để giải thích ý','Luyện tập thời lượng','Mở đầu thu hút vừa đủ','Chuyển ý giữa các phần','Trình bày số liệu dễ hiểu','Trích nguồn trên slide','Sử dụng hình ảnh hợp pháp','Chuẩn bị câu hỏi và trả lời','Kiểm soát tốc độ nói','Dùng ghi chú người thuyết trình','Thuyết trình trực tuyến','Phối hợp thuyết trình nhóm','Kiểm tra thiết bị trước buổi trình bày','Giảm chữ thừa trong slide','Tạo call to action phù hợp','Đánh giá sau thuyết trình','Xây dựng phiên bản dự phòng'])
}
FORMATS=[
('QD','Hướng dẫn nhanh','Tài liệu học thuật'),('WS','Phiếu thực hành','Bài tập'),('CK','Checklist ứng dụng','Tài liệu tham khảo'),('LP','Kế hoạch học tập','Bài giảng'),('AS','Bài tự đánh giá','Ngân hàng đề')
]

def slugify(s):
    import unicodedata
    s=unicodedata.normalize('NFD',s)
    s=''.join(c for c in s if unicodedata.category(c)!='Mn').replace('đ','d').replace('Đ','D').lower()
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')[:110]

def footer(canvas,doc,code):
    canvas.saveState();w,h=A4
    canvas.setStrokeColor(colors.HexColor('#d9e3ef'));canvas.setLineWidth(.4);canvas.line(18*mm,14.8*mm,w-18*mm,14.8*mm)
    canvas.setFont('TimesNewRoman',7.7);canvas.setFillColor(colors.HexColor('#51627a'))
    canvas.drawString(18*mm,10.1*mm,COPY)
    canvas.setFont('TimesNewRoman',6.8);canvas.drawRightString(w-18*mm,10.1*mm,f'{code}  |  ID: {INSTANCE}  |  Trang {doc.page}')
    canvas.restoreState()

def build_story(title,domain,fmt,code,topic):
    styles={
      'title':ParagraphStyle('title',fontName='TimesNewRoman-Bold',fontSize=17,leading=21,alignment=TA_CENTER,textColor=colors.HexColor('#071f55'),spaceAfter=8),
      'sub':ParagraphStyle('sub',fontName='TimesNewRoman',fontSize=11,leading=14,alignment=TA_CENTER,textColor=colors.HexColor('#50617b'),spaceAfter=12),
      'h1':ParagraphStyle('h1',fontName='TimesNewRoman-Bold',fontSize=15,leading=18,textColor=colors.HexColor('#08377f'),spaceBefore=8,spaceAfter=7),
      'h2':ParagraphStyle('h2',fontName='TimesNewRoman-Bold',fontSize=13.5,leading=16,textColor=colors.HexColor('#0a315f'),spaceBefore=7,spaceAfter=5),
      'body':ParagraphStyle('body',fontName='TimesNewRoman',fontSize=13,leading=17,spaceAfter=7,textColor=colors.HexColor('#18243a')),
      'small':ParagraphStyle('small',fontName='TimesNewRoman',fontSize=9.5,leading=12,textColor=colors.HexColor('#5c6d84')),
    }
    st=[]
    if LOGO.exists():
        im=Image(str(LOGO),width=65*mm,height=34*mm,kind='proportional');im.hAlign='CENTER';st.append(im);st.append(Spacer(1,3*mm))
    st += [Paragraph('MẠNG LƯỚI GIÁO DỤC &amp; PHÁT TRIỂN CỘNG ĐỒNG SKY FIRST (SFN)',styles['small']),Spacer(1,2*mm),Paragraph(title,styles['title']),Paragraph(f'{fmt} · {domain} · Mã tài liệu: {code} · Phiên bản 1.0 · {YEAR}',styles['sub'])]
    intro=f"Tài liệu này cung cấp một khung học tập ngắn gọn về <b>{topic}</b>. Mục tiêu là giúp người học hiểu ý chính, biết cách áp dụng vào tình huống thực tế và tự kiểm tra mức độ nắm vững. Nội dung được biên soạn theo hướng phổ thông, không thay thế giáo trình chuyên ngành hoặc hướng dẫn pháp lý/chuyên môn khi bối cảnh yêu cầu." 
    st += [Paragraph('1. Mục tiêu',styles['h1']),Paragraph(intro,styles['body'])]
    objectives=[f'Nhận biết những thành phần cốt lõi của {topic.lower()}.',f'Áp dụng một quy trình đơn giản để xử lý nhiệm vụ liên quan đến {topic.lower()}.',f'Tự đánh giá kết quả và xác định điểm cần cải thiện sau khi thực hành.']
    for i,o in enumerate(objectives,1): st.append(Paragraph(f'<b>{i}.</b> {o}',styles['body']))
    st += [Paragraph('2. Khung kiến thức cốt lõi',styles['h1'])]
    points=[('Xác định bối cảnh','Trước khi hành động, làm rõ mục tiêu, đối tượng, nguồn lực và giới hạn. Một quyết định đúng trong bối cảnh này có thể không phù hợp trong bối cảnh khác.'),('Thực hiện có cấu trúc','Chia nhiệm vụ thành các bước nhỏ, ghi lại giả định quan trọng và ưu tiên thông tin có thể kiểm chứng.'),('Kiểm tra chất lượng','Sau mỗi bước, đối chiếu kết quả với mục tiêu ban đầu; sửa lỗi sớm sẽ giảm chi phí và thời gian về sau.'),('Ghi nhận và cải tiến','Lưu lại điều đã làm tốt, điều chưa ổn và một thay đổi cụ thể cho lần tiếp theo.')]
    for h,b in points: st.append(KeepTogether([Paragraph(h,styles['h2']),Paragraph(b,styles['body'])]))
    st.append(PageBreak());st += [Paragraph('3. Quy trình thực hành',styles['h1'])]
    steps=[('Bước 1 - Làm rõ mục tiêu',f'Viết một câu mô tả kết quả mong muốn khi áp dụng {topic.lower()}. Câu này nên cụ thể và có thể kiểm tra.'),('Bước 2 - Thu thập thông tin', 'Chọn các dữ kiện cần thiết, loại bỏ thông tin không liên quan và đánh dấu phần còn chưa chắc chắn.'),('Bước 3 - Thực hiện', 'Áp dụng phương án theo từng bước, tránh thay đổi nhiều yếu tố cùng lúc nếu chưa biết nguyên nhân của kết quả.'),('Bước 4 - Đánh giá', 'So sánh kết quả với tiêu chí đã đặt ra; nếu chưa đạt, xác định một nguyên nhân có khả năng cao nhất.'),('Bước 5 - Cập nhật', 'Điều chỉnh kế hoạch, lưu phiên bản hoặc ghi chú để có thể tái sử dụng kinh nghiệm.')]
    for h,b in steps: st.append(Paragraph(h,styles['h2']));st.append(Paragraph(b,styles['body']))
    st += [Paragraph('4. Bài thực hành',styles['h1']),Paragraph(f'Hãy chọn một tình huống thật hoặc giả định liên quan đến <b>{topic}</b>. Trả lời lần lượt các câu hỏi sau:',styles['body'])]
    qs=['Mục tiêu cụ thể là gì?','Thông tin nào bạn đã có và thông tin nào còn thiếu?','Bạn sẽ thực hiện theo ba bước nào?','Dấu hiệu nào cho thấy kết quả đã đạt yêu cầu?','Nếu phải làm lại, bạn sẽ thay đổi điều gì?']
    data=[[Paragraph('<b>Câu hỏi</b>',styles['body']),Paragraph('<b>Ghi chú của người học</b>',styles['body'])]]+[[Paragraph(q,styles['body']),''] for q in qs]
    tab=Table(data,colWidths=[70*mm,100*mm],rowHeights=[10*mm]+[17*mm]*len(qs));tab.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.4,colors.HexColor('#c8d5e5')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#edf6ff')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]));st.append(tab)
    st.append(PageBreak());st += [Paragraph('5. Checklist tự đánh giá',styles['h1'])]
    checks=['Tôi có thể giải thích ý chính bằng lời của mình.','Tôi xác định được bối cảnh và mục tiêu trước khi áp dụng.','Tôi biết cách kiểm tra thông tin thay vì dựa hoàn toàn vào suy đoán.','Tôi có thể mô tả các bước thực hiện theo thứ tự.','Tôi ghi nhận kết quả và một điểm cần cải thiện.']
    for c in checks: st.append(Paragraph(f'☐ {c}',styles['body']))
    st += [Paragraph('6. Gợi ý mở rộng',styles['h1']),Paragraph('Sau khi hoàn thành tài liệu, người học nên tìm thêm nguồn chuyên sâu, đối chiếu nhiều nguồn đáng tin cậy và thực hành trong bối cảnh phù hợp. Khi tài liệu được sử dụng trong lớp học, người hướng dẫn có thể thay đổi tình huống thực hành nhưng nên giữ nguyên mục tiêu và tiêu chí đánh giá.',styles['body']),Paragraph('7. Ghi chú về sử dụng tài liệu',styles['h1']),Paragraph('Tài liệu được xây dựng cho mục đích giáo dục và phát triển năng lực. Không sử dụng nội dung để thay thế tư vấn pháp lý, y tế, tài chính hoặc hướng dẫn chuyên môn bắt buộc trong các tình huống có rủi ro cao. Khi trích dẫn hoặc tái sử dụng, cần giữ thông tin nguồn và bản quyền theo quy định của SFN.',styles['body']),Spacer(1,8*mm),Paragraph(f'<b>Định danh hệ thống:</b> {INSTANCE}',styles['small']),Paragraph(f'<b>Phiên bản:</b> 1.0 · <b>Năm:</b> {YEAR}',styles['small'])]
    return st

def main():
    rows=[];counter=1
    for prefix,(domain,field_id,field_name,topics) in DOMAINS.items():
      for topic_idx,topic in enumerate(topics,1):
        for fmt_code,fmt_name,doc_type in FORMATS:
          code=f'SFN-{prefix}-{YEAR}-{counter:06d}'
          title=f'{fmt_name}: {topic}'
          fn=f'{code}-{slugify(topic)}-{fmt_code.lower()}.pdf'
          path=OUT/fn
          doc=SimpleDocTemplate(str(path),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=16*mm,bottomMargin=20*mm,title=title,author='Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN)',subject=domain,keywords=f'SFN, Sky First Academic Hub, {domain}, {topic}',creator=f'Sky First Academic Hub {INSTANCE}')
          story=build_story(title,domain,fmt_name,code,topic)
          doc.build(story,onFirstPage=lambda c,d,co=code: footer(c,d,co),onLaterPages=lambda c,d,co=code: footer(c,d,co))
          raw=path.read_bytes();sha=hashlib.sha256(raw).hexdigest()
          cat={'QD':'cat_topic','WS':'cat_exercise','CK':'cat_topic','LP':'cat_lesson','AS':'cat_exam'}[fmt_code]
          rows.append({'id':f'doc_seed_{counter:06d}','code':code,'slug':slugify(f'{code}-{title}'),'title':title,'summary':f'{fmt_name} về {topic.lower()}, được biên soạn cho kho học liệu khởi tạo Sky First Academic Hub.','document_type':doc_type,'library_scope':'sfn','unit_id':'unit_sfn','field_id':field_id,'category_id':cat,'authors':'Ban biên soạn học thuật SFN','keywords':f'{domain}; {topic}; {fmt_name}','language':'vi','publication_year':YEAR,'status':'draft','access_mode':'view_download','version_label':'1.0','filename':fn,'relative_path':f'pdfs/{fn}','sha256':sha,'file_size':len(raw),'instance_id':INSTANCE,'copyright':COPY})
          counter+=1
    (ROOT/'seed-library'/'manifest.json').write_text(json.dumps({'instance_id':INSTANCE,'generated_at':'2026-09-01','count':len(rows),'documents':rows},ensure_ascii=False,indent=2),encoding='utf-8')
    with (ROOT/'seed-library'/'manifest.csv').open('w',newline='',encoding='utf-8-sig') as f:
      w=csv.DictWriter(f,fieldnames=list(rows[0].keys()));w.writeheader();w.writerows(rows)
    print('generated',len(rows),'PDFs')
if __name__=='__main__': main()
