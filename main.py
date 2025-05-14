import json
import re
import tomllib
import traceback
import aiohttp
import filetype
from loguru import logger
from typing import Union
from WechatAPI import WechatAPIClient
from database.XYBotDB import XYBotDB
from utils.decorators import *
from utils.plugin_base import PluginBase
import logging


class Bncr(PluginBase):
    description = "Bncr"
    author = "sxkiss"
    version = "1.0.1"

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
            logger.info("推送无界成功")
            async with aiohttp.request("post", url=self.base_url, json=message) as req:
                return await req.json()             
        except Exception as e:
            logger.error(f"推送无界失败:{str(e)}")
            logger.error(f"推送无界失败:{req.status} - {req.text()}")
            return

    @on_text_message
    async def handle_text(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了无界文本消息")
        return await self.request(message)

    @on_at_message
    async def handle_at(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了无界被@消息")
        return await self.request(message)

    @on_image_message
    async def handle_image(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了无界图片消息")
        return await self.request(message)

    @on_video_message
    async def handle_video(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了无界视频消息")
        return await self.request(message)

    @on_file_message
    async def handle_file(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了无界文件消息")
        return await self.request(message)

    @on_quote_message
    async def handle_quote(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了无界引用消息")
        return await self.request(message)

    @on_pat_message
    async def handle_pat(self, bot: WechatAPIClient, message: dict):
        logger.info("收到了无界拍一拍消息")
        return await self.request(message)
    # @on_sys_message
    # async def handle_sys(self, bot: WechatAPIClient, message: dict):
        # logger.info("收到了无界系统消息")
        #return await self.request(message)
    @schedule('interval', seconds=5)
    async def periodic_task(self, bot: WechatAPIClient):
        logger.info("每5秒无界执行一次")