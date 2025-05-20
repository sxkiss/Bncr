import json
import re
import tomllib
import traceback
import httpx
import filetype
from loguru import logger
from typing import Union
from WechatAPI import WechatAPIClient
from database.XYBotDB import XYBotDB
from utils.decorators import *
from utils.plugin_base import PluginBase
import logging
import os


class Bncr(PluginBase):
    """
    @classdesc Bncr 插件主类
    @author sxkiss
    @version 1.0.3
    """
    description = "Bncr插件"
    author = "sxkiss"
    version = "1.0.3"

    def __init__(self):
        """
        @description 初始化Bncr插件，加载配置
        """
        super().__init__()
        config_path = os.path.join(os.path.dirname(__file__), "config.toml")
        try:
            with open(config_path, "rb") as f:
                config = tomllib.load(f)
            basic_config = config.get("basic", {})
            self.enable = basic_config.get("enable", False)
            self.base_url = basic_config.get("base_url", "")
            self.other_plugin_cmd = basic_config.get("other-plugin-cmd", [])
        except Exception as e:
            logger.error(f"加载Bncr插件配置文件失败: {str(e)}")
            self.enable = False
            self.base_url = ""
            self.other_plugin_cmd = []

    @on_text_message(priority=20)
    async def handle_text(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理文本消息（无条件推送到无界API）
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        @returns {bool} 是否允许后续插件处理
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界文本消息: {message.get('Content')}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理文本消息出错: {str(e)}")
            return True

    @on_image_message(priority=20)
    async def handle_image(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理图片消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        @returns {bool} 是否允许后续插件处理
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界图片消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理图片消息出错: {str(e)}")
            return True

    @on_at_message(priority=20)
    async def handle_at(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理@消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        @returns {bool} 是否允许后续插件处理
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界@消息: {message.get('Content')}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理@消息出错: {str(e)}")
            return True

    @on_video_message
    async def handle_video(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理视频消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界视频消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理视频消息出错: {str(e)}")
            return True

    @on_file_message
    async def handle_file(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理文件消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界文件消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理文件消息出错: {str(e)}")
            return True

    @on_quote_message
    async def handle_quote(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理引用消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界引用消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理引用消息出错: {str(e)}")
            return True

    @on_pat_message
    async def handle_pat(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理拍一拍消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界拍一拍消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理拍一拍消息出错: {str(e)}")
            return True

    @on_voice_message(priority=20)
    async def handle_voice(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理语音消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        @returns {bool} 是否允许后续插件处理
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界语音消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理语音消息出错: {str(e)}")
            return True

    @on_xml_message(priority=20)
    async def handle_xml(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理XML消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        @returns {bool} 是否允许后续插件处理
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界XML消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理XML消息出错: {str(e)}")
            return True

    @on_emoji_message(priority=20)
    async def handle_emoji(self, bot: WechatAPIClient, message: dict):
        """
        @description 处理表情消息
        @param {WechatAPIClient} bot - 机器人实例
        @param {dict} message - 消息内容
        @returns {bool} 是否允许后续插件处理
        """
        if not self.enable:
            return True
        try:
            logger.info(f"收到无界表情消息: {message}")
            await self.request(message)
            return True
        except Exception as e:
            logger.error(f"处理表情消息出错: {str(e)}")
            return True

    @schedule('interval', seconds=60)
    async def periodic_task(self, bot: WechatAPIClient):
        """
        @description 每60秒执行一次的定时任务
        @param {WechatAPIClient} bot - 机器人实例
        """
        if not self.enable:
            return
        logger.info("Bncr插件定时任务执行中...")

    async def request(self, message: dict):
        """
        @description 向无界API推送消息，自动尝试 HTTP 异步、WebSocket、HTTP 同步三种方式，失败自动切换
        @param {dict} message - 消息内容
        """
        if not self.base_url:
            logger.warning("base_url未配置，无法推送消息")
            return
        # 1. HTTP 异步
        try:
            logger.info(f"[请求] 尝试 HTTP 异步请求: {self.base_url}")
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(self.base_url, json=message)
                logger.info(f"[请求] HTTP异步响应: {resp.status_code} {resp.text}")
                if resp.status_code == 200:
                    logger.info(f"[请求] HTTP异步推送成功")
                    return resp.text
                else:
                    logger.warning("[请求] HTTP异步请求失败，尝试WebSocket")
        except Exception as e:
            logger.error(f"[请求] HTTP异步请求异常: {e}")
        # 2. WebSocket
        try:
            import websockets
            import asyncio
            ws_url = self.base_url.replace('http://', 'ws://').replace('https://', 'wss://')
            logger.info(f"[请求] 尝试 WebSocket 请求: {ws_url}")
            async with websockets.connect(ws_url, ping_interval=None) as ws:
                await ws.send(json.dumps(message))
                resp = await ws.recv()
                logger.info(f"[请求] WebSocket响应: {resp}")
                logger.info(f"[请求] WebSocket推送成功")
                return resp
        except Exception as e:
            logger.error(f"[请求] WebSocket请求异常: {e}")
        # 3. HTTP 同步
        try:
            import requests
            logger.info(f"[请求] 尝试 HTTP 同步请求: {self.base_url}")
            resp = requests.post(self.base_url, json=message, timeout=30)
            logger.info(f"[请求] HTTP同步响应: {resp.status_code} {resp.text}")
            if resp.status_code == 200:
                logger.info(f"[请求] HTTP同步推送成功")
                return resp.text
            else:
                logger.error("[请求] HTTP同步请求失败")
        except Exception as e:
            logger.error(f"[请求] HTTP同步请求异常: {e}")
        logger.error("[请求] 所有请求方式均失败，消息未能推送到无界API")

    async def on_disable(self):
        """
        @description 插件禁用时调用，清理资源
        """
        logger.info("Bncr插件已禁用，资源清理完成")