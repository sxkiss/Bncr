from loguru import logger

from WechatAPI import WechatAPIClient
from utils.decorators import *
from utils.plugin_base import PluginBase
from database.XYBotDB import XYBotDB
import aiohttp
import tomllib


class Bncr(PluginBase):
    description = "Bncr"
    author = "网络人"
    version = "1.0.0"

    def __init__(self):
        super().__init__()

        with open("plugins/Bncr/config.toml", "rb") as f:
            plugin_config = tomllib.load(f)

        with open("main_config.toml", "rb") as f:
            main_config = tomllib.load(f)

        config = plugin_config["Bncr"]
        main_config = main_config["XYBot"]

        self.enable = config["enable"]
        self.version = main_config["version"]
        self.base_url = config["base_url"]

    async def request(self, message):
        try:
            logger.debug(message)
            async with aiohttp.request("POST", url=self.base_url, json=message) as req:
                return await req.json()
        except Exception as e:
            logger.error(f"推送无界失败: {str(e)}")
            return

    @on_text_message(priority=80)
    async def handle_text(self, bot: WechatAPIClient, message: dict):
        return await self.request(message)
        
    @on_at_message
    async def handle_at(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了被@消息")
        return await self.request(message)
        
    @on_xml_message
    async def handle_xml(self, bot: WechatAPIClient, message: dict):
       logger.info("收到了xml消息")
       return await self.request(message)
         
    @on_friend_request(priority=99)
    async def handle_friend(self, bot: WechatAPIClient, message: dict):
       logger.info("收到了好友申请")
       return await self.request(message)

    @on_voice_message
    async def handle_voice(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了语音消息")
        #return await self.request(message)

    @on_image_message
    async def handle_image(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了图片消息")
         #return await self.request(message)

    @on_video_message
    async def handle_video(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了视频消息")
         #return await self.request(message)

    @on_file_message
    async def handle_file(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了文件消息")
        return await self.request(message)

    @on_quote_message
    async def handle_quote(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了引用消息")
        #return await self.request(message)

    @on_sys_message
    async def handle_sys(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了系统消息")
        #return await self.request(message)

    @on_pat_message
    async def handle_pat(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了拍一拍消息")
        return await self.request(message)

    @on_emoji_message
    async def handle_emoji(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了表情消息")
        #return await self.request(message)

    # @schedule('interval', seconds=5)
    # async def periodic_task(self, bot: WechatAPIClient):
    #     logger.info("我每5秒执行一次")

    # @schedule('cron', hour=8, minute=30, second=30)
    # async def daily_task(self, bot: WechatAPIClient):
    #     logger.info("我每天早上8点30分30秒执行")

    # @schedule('date', run_date='2025-01-29 00:00:00')
    # async def new_year_task(self, bot: WechatAPIClient):
    #     logger.info("我在2025年1月29日执行")
