import asyncio
import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.error import BadRequest
from telegram.ext import Application, CallbackQueryHandler, ContextTypes

TELEGRAM_BOT_TOKEN = "8915046970:AAFx3i_exp-FH3w0F6Bu595AtdeYWcl35FM"
ADMIN_CHAT_ID = "8681578654"

logging.basicConfig(level=logging.INFO)

# 트렌디한 3D 아트워크/브랜딩 시안 이미지 샘플 (고화질 URL)
QUALITY_LOGO_URL = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"

PENDING_ASSET = {
    "title": "StanPC 브랜드 자산 & 바이오 세팅 재기획안",
    "logo_concept": "3D 홀로그램 포토카드 프레임 + 픽셀 Earth 캐릭터 + 네온 그래프",
    "bio_text": "포카 사기·오버페이 방지 보디가드 🛡️ | 번장·메르카리·이베이 실시간 시세 비교 | 스태너들의 목소리로 만드는 stanpc.com",
    "persona": "Earth (친근한 3D 픽셀 마스코트)",
    "specs": ["Favicon (32x32)", "SNS Profile (500x500)", "OG Image (1200x630)"]
}

async def send_approval_request(app: Application):
    caption_text = (
        f"<b>[Earth 🤖] {PENDING_ASSET['title']}</b>\n\n"
        f"대표님, 이전 시안의 부족함을 인정하고 고품질 3D 아트워크 컨셉으로 재기획했습니다.\n\n"
        f"• <b>컨셉:</b> {PENDING_ASSET['logo_concept']}\n"
        f"• <b>SNS 바이오:</b> {PENDING_ASSET['bio_text']}\n"
        f"• <b>캐릭터:</b> {PENDING_ASSET['persona']}\n\n"
        f"위 방향성으로 확정 후 브랜드 가이드를 제작할까요?"
    )

    keyboard = [
        [
            InlineKeyboardButton("👍 승인 & 반영", callback_data="approve_assets"),
            InlineKeyboardButton("✏️ 피드백 남기기", callback_data="revise_assets"),
        ],
        [InlineKeyboardButton("❌ 컨셉 전체 재검토", callback_data="reject_assets")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await app.bot.send_photo(
        chat_id=ADMIN_CHAT_ID,
        photo=QUALITY_LOGO_URL,
        caption=caption_text,
        parse_mode="HTML",
        reply_markup=reply_markup
    )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    try:
        await query.answer()
    except BadRequest:
        pass

    if query.data == "approve_assets":
        status_text = "\n\n<b>[✅ 승인 완료]</b>\n대표님 승인 완료. 본 컨셉으로 최종 브랜드 자산을 정립합니다."
    elif query.data == "revise_assets":
        status_text = "\n\n<b>[✏️ 수정 요청]</b>\n피드백을 바탕으로 디자인 디테일을 다시 보완하겠습니다."
    elif query.data == "reject_assets":
        status_text = "\n\n<b>[❌ 재검토]</b>\n완전히 새로운 컨셉으로 다시 기획하겠습니다."
    else:
        status_text = ""

    if query.message.caption:
        new_caption = f"{query.message.caption_html}{status_text}"
        await query.edit_message_caption(caption=new_caption, parse_mode="HTML")

def main():
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CallbackQueryHandler(button_handler))

    async def post_init(application: Application):
        await send_approval_request(application)
        print("🚀 고품질 재기획 시안 텔레그램 발송 완료!")

    app.post_init = post_init
    app.run_polling()

if __name__ == "__main__":
    main()