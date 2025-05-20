/**
 * This file is part of the Bncr project.
 * @author sxkiss
 * @email admin@sxkiss.com
 * @project https://github.com/sxkiss/Bncr
 * @name xx
 * @team sxkiss
 * @version 1.0.2
 * @description xx适配器 (精简版  - 仅支持文本/图片消息)
 * @adapter true
 * @public true
 * @disable false
 * @priority 2
 * @Copyright ©2025 sxkiss. All rights reserved
 * @classification ["适配器"]
 * Unauthorized copying of this file, via any medium is strictly prohibited
 */
/* HideStart */
/* 配置构造器 */
const jsonSchema = BncrCreateSchema.object({
  enable: BncrCreateSchema.boolean().setTitle('是否开启适配器').setDescription(`设置为关则不加载该适配器`).setDefault(false),
  sendUrl: BncrCreateSchema.string().setTitle('上报地址').setDescription(`xx的地址`).setDefault('http://192.168.0.134:10010/'),
  /**
   * 微信机器人ID（xxx_botid）
   * 可手动填写，优先使用此配置，否则自动获取
   */
  xxx_botid: BncrCreateSchema.string()
    .setTitle('微信机器人ID（xxx_botid）')
    .setDescription('用于指定机器人wxid，优先使用此配置，否则自动获取')
    .setDefault(''),
  /**
   * 拍一拍自动回复类型
   * 可选: text（文字）、image（图片）、video（视频）、link（链接）
   */
  patReplyType: BncrCreateSchema.string()
    .setTitle('拍一拍回复类型')
    .setDescription('拍一拍自动回复类型（可选：text、image、video、link）')
    .setDefault('text'),
  /**
   * 拍一拍回复内容
   * text类型: 文字内容
   * image类型: 图片URL或Base64
   * video类型: 视频URL或Base64
   * link类型: JSON格式的链接卡片配置
   */
  patReplyContent: BncrCreateSchema.string()
    .setTitle('拍一拍回复内容')
    .setDescription('拍一拍回复内容(根据类型填写对应格式)')
    .setDefault('你拍我干嘛'),
  /**
   * 视频封面图（仅video类型需要）
   */
  patVideoThumb: BncrCreateSchema.string()
    .setTitle('视频封面图')
    .setDescription('视频类型回复的封面图URL或Base64')
    .setDefault(''),
  /**
   * 视频时长（仅video类型需要）
   */
  patVideoDuration: BncrCreateSchema.number()
    .setTitle('视频时长(秒)')
    .setDescription('视频类型回复的时长(秒)')
    .setDefault(0),
  /**
   * 链接卡片标题（仅link类型需要）
   */
  patLinkTitle: BncrCreateSchema.string()
    .setTitle('链接卡片标题')
    .setDescription('链接类型回复的卡片标题')
    .setDefault(''),
  /**
   * 链接卡片描述（仅link类型需要）
   */
  patLinkDesc: BncrCreateSchema.string()
    .setTitle('链接卡片描述')
    .setDescription('链接类型回复的卡片描述')
    .setDefault(''),
  /**
   * 链接卡片缩略图（仅link类型需要）
   */
  patLinkThumb: BncrCreateSchema.string()
    .setTitle('链接卡片缩略图')
    .setDescription('链接类型回复的卡片缩略图URL')
    .setDefault(''),
  /**
   * 拍一拍自动回复延迟（秒）
   */
  patReplyDelay: BncrCreateSchema.number()
    .setTitle('拍一拍回复延迟(秒)')
    .setDescription('拍一拍自动回复延迟秒数')
    .setDefault(0)
});
/* 配置管理器 */
const ConfigDB = new BncrPluginConfig(jsonSchema);
module.exports = async () => {
  /* 读取用户配置 */
  await ConfigDB.get();
  if (!Object.keys(ConfigDB.userConfig).length) {
    sysMethod.startOutLogs('未启用xx适配器,退出.');
    return;
  }
  if (!ConfigDB.userConfig.enable) return sysMethod.startOutLogs('未启用xx 退出.');
  let xxUrl = ConfigDB.userConfig.sendUrl;
  if (!xxUrl) return console.log('xx:配置文件未设置sendUrl');

  // 日志：配置加载完成
  console.log('[xx] 配置加载完成', { xxUrl });
  //这里new的名字将来会作为 sender.getFrom() 的返回值
  const xx = new Adapter('xx');
  // 导入axios库
  const axios = require('axios');
  // 包装原生require (仅作备用，优先使用axios)
  const request = require('util').promisify(require('request'));
  // wx数据库
  const wxDB = new BncrDB('xxUrl');
  let botgroup =  await wxDB.get('xx_IsGroup', '');
  let botId = ConfigDB.userConfig.xxx_botid || await wxDB.get('xx_botid', ''); // 优先用配置，否则自动获取
  /**向/api/系统路由中添加路由 */
  router.get('/api/bot/xx', (req, res) => res.send({ msg: '这是xxUrl Api接口，你的get请求测试正常~，请用post交互数据' }));
  router.post('/api/bot/xx', async (req, res) => {
    try {
      const body = req.body;
      if (botId !== body.wxid)
        botId = await wxDB.set('xx_botid', body.ToUserName.string, { def: body.ToUserName.string });
      botgroup = await wxDB.set('xx_IsGroup', body.IsGroup, { def: body.IsGroup });

      let msgInfo = null;

      // 拍一拍消息处理
      if (body.MsgType === 10002 && body.Content) {
        try {
          // 检查是否为拍一拍系统消息
          if (body.Content.includes('<sysmsg type="pat">')) {
            console.log('[xx] 检测到拍一拍消息，开始解析');

            // 解析XML内容
            const xmlContent = body.Content.trim();
            const patInfo = {
              fromUser: '', // 发起拍一拍的用户
              chatroom: '', // 群聊ID
              patted: '',   // 被拍的用户
              template: ''  // 消息模板
            };

            // 提取必要信息
            const matches = {
              fromUser: /<fromusername>(.*?)<\/fromusername>/,
              chatroom: /<chatusername>(.*?)<\/chatusername>/,
              patted: /<pattedusername>(.*?)<\/pattedusername>/,
              template: /<template><!\[CDATA\[(.*?)\]\]><\/template>/
            };

            for (const [key, regex] of Object.entries(matches)) {
              const match = xmlContent.match(regex);
              if (match && match[1]) {
                patInfo[key] = match[1];
              }
            }

            console.log('[xx] 解析拍一拍消息信息:', patInfo);

            // 确认是真实的拍一拍消息
            if (patInfo.fromUser && patInfo.patted && patInfo.template.includes('拍了拍')) {
              if (ConfigDB.userConfig.patReplyType && ConfigDB.userConfig.patReplyContent) {
                const delay = (ConfigDB.userConfig.patReplyDelay || 0) * 1000;

                setTimeout(async () => {
                  try {
                    let replyInfo = {
                      userId: patInfo.fromUser,           // 回复给拍一拍发起者
                      groupId: patInfo.chatroom || '0'    // 群聊场景
                    };

                    switch(ConfigDB.userConfig.patReplyType) {
                      case 'text':
                        replyInfo = {
                          ...replyInfo,
                          type: 'text',
                          msg: ConfigDB.userConfig.patReplyContent
                        };
                        break;

                      case 'image':
                        replyInfo = {
                          ...replyInfo,
                          type: 'image',
                          path: ConfigDB.userConfig.patReplyContent
                        };
                        break;

                      case 'video':
                        replyInfo = {
                          ...replyInfo,
                          type: 'video',
                          path: ConfigDB.userConfig.patReplyContent,
                          thumbPath: ConfigDB.userConfig.patVideoThumb,
                          duration: ConfigDB.userConfig.patVideoDuration
                        };
                        break;

                      case 'link':
                        replyInfo = {
                          ...replyInfo,
                          type: 'link',
                          title: ConfigDB.userConfig.patLinkTitle || '分享',
                          desc: ConfigDB.userConfig.patLinkDesc || '',
                          url: ConfigDB.userConfig.patReplyContent,
                          thumbUrl: ConfigDB.userConfig.patLinkThumb
                        };
                        break;

                      default:
                        console.error('[xx] 不支持的拍一拍回复类型:', ConfigDB.userConfig.patReplyType);
                        return;
                    }

                    const replyBody = await constructMessage(replyInfo, botId, !!patInfo.chatroom);
                    if (replyBody) {
                      await sendMsgToXX(replyBody);
                      console.log(`[xx] 拍一拍自动回复已发送:`, {
                        type: ConfigDB.userConfig.patReplyType,
                        api: replyBody.api,
                        to: patInfo.fromUser,
                        inChatroom: !!patInfo.chatroom
                      });
                    }
                  } catch (err) {
                    console.error('[xx] 拍一拍自动回复失败:', err);
                  }
                }, delay);
              }
            } else {
              console.log('[xx] 不完整的拍一拍消息，跳过处理');
            }
          }
        } catch (err) {
          console.error('[xx] 解析拍一拍消息失败:', err);
        }
      }

      //私聊
      if (botgroup == false) {
        msgInfo = {
          userId: body.SenderWxid || '',
          userName: body.SenderWxid || '',
          groupId: '0',
          groupName: '',
          msg: body.Content || '',
          msgId: body.MsgId || '',
          fromType: `Social`,
        };
        //群
      } else if (botgroup == true) {
        msgInfo = {
          userId: body.SenderWxid || '',
          userName: body.SenderWxid || '',
          groupId: body.FromWxid || '0',
          groupName: body.FromWxid || '',
          msg: body.Content || '',
          msgId: body.MsgId || '',
          fromType: `Social`,
        };
      }

      // 日志：收到消息
      console.log('[xx] 收到消息', msgInfo);
      msgInfo && xx.receive(msgInfo);
      res.send({ status: 200, data: '', msg: 'ok' });
    } catch (e) {
      console.error('[xx] 消息处理异常:', e);
      res.send({ status: 400, data: '', msg: e.toString() });
    }
  });
  // 直接强制apiPrefix为VXAPI
  let apiPrefix = '/VXAPI';

  /**
   * 构造消息体
   * @param {Object} replyInfo 回复信息对象
   * @param {string} botId 机器人ID
   * @param {boolean} botgroup 是否群聊
   * @returns {Promise<Object|null>} 构造好的消息体或null
   */
  async function constructMessage(replyInfo, botId, botgroup) {
    try {
      // 基础请求头
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      };

      // 基础请求参数
      const baseParams = {
        Wxid: botId,
        ToWxid: botgroup ? replyInfo.groupId : replyInfo.userId
      };

      // 根据消息类型构造不同的请求体
      let endpoint = '';
      let params = {};

      switch(replyInfo.type) {
        case 'text':
          endpoint = `${apiPrefix}/Msg/SendTxt`;
          params = {
            ...baseParams,
            Content: replyInfo.msg,
            Type: botgroup ? 1 : 0,
            At: replyInfo.at || ''
          };
          break;

        case 'image':
          endpoint = `${apiPrefix}/Msg/UploadImg`;

          // 统一转换为Base64处理
          if (replyInfo.path) {
            if (replyInfo.path.startsWith('http://') || replyInfo.path.startsWith('https://')) {
              // 网络图片，直接下载并转Base64
              try {
                const imgResponse = await axios.get(replyInfo.path, {
                  responseType: 'arraybuffer',
                  timeout: 10000
                });
                const base64Image = Buffer.from(imgResponse.data, 'binary').toString('base64');
                params = {
                  ...baseParams,
                  Base64: base64Image
                };
              } catch (e) {
                return null;
              }
            } else if (replyInfo.path.startsWith('data:image')) {
              // 已经是Base64格式
              params = {
                ...baseParams,
                Base64: replyInfo.path.split(',')[1] || replyInfo.path
              };
            } else {
              // 本地文件，读取并转Base64
              try {
                const fs = require('fs');
                const imageBuffer = fs.readFileSync(replyInfo.path);
                const base64Image = imageBuffer.toString('base64');
                params = {
                  ...baseParams,
                  Base64: base64Image
                };
              } catch (e) {
                return null;
              }
            }
          } else if (replyInfo.url) {
            // 网络图片URL，下载并转Base64
            try {
              const imgResponse = await axios.get(replyInfo.url, {
                responseType: 'arraybuffer',
                timeout: 10000
              });
              const base64Image = Buffer.from(imgResponse.data, 'binary').toString('base64');
              params = {
                ...baseParams,
                Base64: base64Image
              };
            } catch (e) {
              return null;
            }
          } else if (replyInfo.base64) {
            // 直接使用提供的Base64
            params = {
              ...baseParams,
              Base64: replyInfo.base64
            };
          } else {
            return null;
          }
          break;

        case 'video':
          console.log('[xx] 处理视频消息');

          // 使用handleVideoMessage函数处理视频消息
          const videoParams = await handleVideoMessage(replyInfo, baseParams);
          if (!videoParams) {
            console.error('[xx] 视频消息处理失败');
            return null;
          }

          // 设置endpoint和params
          endpoint = `${apiPrefix}/Msg/SendVideo`;
          params = videoParams;
          break;

        case 'voice':
          endpoint = `${apiPrefix}/Msg/SendVoice`;
          params = {
            ...baseParams,
            Base64: replyInfo.base64 || '',
            Type: replyInfo.voiceType || 0, // 0=AMR 4=SILK
            VoiceTime: replyInfo.duration || 1000
          };
          break;

        case 'link':
          endpoint = `${apiPrefix}/Msg/ShareLink`;
          params = {
            ...baseParams,
            Title: replyInfo.title || '',
            Desc: replyInfo.desc || '',
            Url: replyInfo.url || '',
            ThumbUrl: replyInfo.thumbUrl || ''
          };
          break;

        case 'card':
          endpoint = `${apiPrefix}/Msg/ShareCard`;
          params = {
            ...baseParams,
            CardWxId: replyInfo.cardWxId || '',
            CardNickName: replyInfo.cardNickName || '',
            CardAlias: replyInfo.cardAlias || ''
          };
          break;

        default:
          console.error('[xx] 不支持的消息类型:', replyInfo.type);
          return null;
      }

      // 添加api字段到params
      params.api = endpoint;
      console.log('[xx] 最终发送的消息参数:', {
        ...params,
        Base64: params.Base64 ? `${params.Base64.substring(0, 20)}...` : undefined,
        ImageBase64: params.ImageBase64 ? `${params.ImageBase64.substring(0, 20)}...` : undefined
      });

      return params;
    } catch (error) {
      return null;
    }
  }

  /**
   * 生成默认视频缩略图
   * @returns {string} Base64格式的默认缩略图
   */
  function generateDefaultThumb() {
    // 生成一个120x120的纯黑色JPEG图片的Base64
    return '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAB4AHgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooqKeYQRPK2dqjJwM0AS0Vx+k+JNY1W/NrYeGGnRWzJL9vhQL9DhufwrYvdZu9PsJL250G7it0++/2iMgfiRQBoUVyEHjTWJ4hKnhK+KHowuISP5101tcR3VtHcQtuikUMrDuDQA+iiigAooooAKKKKACiiigAooooAKKKKAOY8baJe69osdppxhE6XKSlZpNgIAI6/XFZ+u+BBqGiWVhb6nNZvp+DbyxAYyOcH1B/nXd0UAePXPgHxBNbs0fii4trgDKuBICp7cbs/wA61NP8I3N/pVjPqfiTULl57dJGTzQiKxGcALwAK7+igDhLb4fatbtJLbeKJ0mckia5V5io7AAgAD8K6XQ9PudK0qKzur6S8mTO6WTGSScn9TV+igAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9k=';
  }

  /**
   * 尝试从视频URL中获取封面图
   * @param {string} videoUrl 视频URL
   * @returns {Promise<string|null>} 封面图的Base64编码，如果获取失败则返回null
   */
  async function getVideoThumbnailFromUrl(videoUrl) {
    console.log('[xx] 尝试从视频URL获取封面图:', videoUrl);

    try {
      // 1. 尝试常见的视频平台封面获取方式

      // 优酷视频
      if (videoUrl.includes('youku.com') || videoUrl.includes('ykimg.com')) {
        // 从URL中提取视频ID
        const match = videoUrl.match(/id_([^.]+)/);
        if (match && match[1]) {
          const videoId = match[1];
          const thumbUrl = `https://vthumb.ykimg.com/054204085${videoId}`;
          try {
            const response = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 10000 });
            return Buffer.from(response.data, 'binary').toString('base64');
          } catch (e) {
            console.log('[xx] 获取优酷视频封面失败:', e.message);
          }
        }
      }

      // 腾讯视频
      if (videoUrl.includes('v.qq.com') || videoUrl.includes('video.qq.com') || videoUrl.includes('txmov')) {
        // 尝试从URL中提取视频ID或直接构造缩略图URL
        // 对于txmov链接，尝试直接替换后缀
        if (videoUrl.includes('txmov') || videoUrl.includes('kwimgs.com')) {
          const thumbUrl = videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '.jpg');
          try {
            const response = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 10000 });
            return Buffer.from(response.data, 'binary').toString('base64');
          } catch (e) {
            console.log('[xx] 获取腾讯视频封面失败:', e.message);
          }
        }
      }

      // 哔哩哔哩
      if (videoUrl.includes('bilibili.com') || videoUrl.includes('b23.tv')) {
        // 从URL中提取视频ID
        const match = videoUrl.match(/\/([AaBb][Vv][0-9]+)/);
        if (match && match[1]) {
          const videoId = match[1];
          const thumbUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`;
          try {
            const response = await axios.get(thumbUrl, { timeout: 10000 });
            if (response.data && response.data.data && response.data.data.pic) {
              const picUrl = response.data.data.pic;
              const picResponse = await axios.get(picUrl, { responseType: 'arraybuffer', timeout: 10000 });
              return Buffer.from(picResponse.data, 'binary').toString('base64');
            }
          } catch (e) {
            console.log('[xx] 获取哔哩哔哩视频封面失败:', e.message);
          }
        }
      }

      // 2. 通用方法：尝试常见的缩略图命名模式
      const urlObj = new URL(videoUrl);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      const filenameWithoutExt = filename.split('.')[0];

      const possibleThumbUrls = [
        // 替换扩展名
        videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '.jpg'),
        videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '.jpeg'),
        videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '.png'),

        // 添加后缀
        videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '_thumb.jpg'),
        videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '-thumb.jpg'),
        videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '_cover.jpg'),
        videoUrl.replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '-cover.jpg'),

        // 构造缩略图URL
        `${urlObj.origin}${pathname.replace(filename, 'thumb_' + filename).replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '.jpg')}`,
        `${urlObj.origin}${pathname.replace(filename, 'cover_' + filename).replace(/\.(mp4|mov|avi|flv|wmv|mkv)/, '.jpg')}`,
        `${urlObj.origin}${pathname.replace(filename, filenameWithoutExt + '_thumb.jpg')}`,
        `${urlObj.origin}${pathname.replace(filename, filenameWithoutExt + '_cover.jpg')}`
      ];

      // 尝试所有可能的缩略图URL
      for (const thumbUrl of possibleThumbUrls) {
        try {
          console.log('[xx] 尝试获取缩略图:', thumbUrl);
          const response = await axios.get(thumbUrl, {
            responseType: 'arraybuffer',
            timeout: 5000,
            validateStatus: status => status === 200 // 只接受200状态码
          });

          // 检查是否是图片
          const contentType = response.headers['content-type'];
          if (contentType && contentType.startsWith('image/')) {
            console.log('[xx] 成功获取视频封面:', thumbUrl);
            return Buffer.from(response.data, 'binary').toString('base64');
          }
        } catch (e) {
          // 忽略错误，继续尝试下一个URL
        }
      }

      // 3. 尝试下载视频并使用ffmpeg提取封面
      try {
        console.log('[xx] 尝试下载视频并使用ffmpeg提取封面');

        // 创建临时文件路径
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        const { execSync } = require('child_process');
        const crypto = require('crypto');

        // 生成基于URL的唯一文件名
        const urlHash = crypto.createHash('md5').update(videoUrl).digest('hex');
        const tempDir = os.tmpdir();
        const tempVideoPath = path.join(tempDir, `video_${urlHash}.mp4`);
        const tempThumbPath = path.join(tempDir, `thumb_${urlHash}.jpg`);

        // 下载视频到临时文件
        console.log('[xx] 下载视频到临时文件:', tempVideoPath);

        // 使用curl或wget下载视频（避免内存问题）
        try {
          // 尝试使用curl下载
          execSync(`curl -L "${videoUrl}" -o "${tempVideoPath}" --connect-timeout 30 --max-time 60`, { stdio: 'pipe' });
        } catch (curlError) {
          try {
            // 如果curl失败，尝试使用wget
            execSync(`wget "${videoUrl}" -O "${tempVideoPath}" --timeout=30`, { stdio: 'pipe' });
          } catch (wgetError) {
            // 如果wget也失败，使用axios下载
            console.log('[xx] curl和wget下载失败，尝试使用axios下载');
            const videoResponse = await axios.get(videoUrl, {
              responseType: 'arraybuffer',
              timeout: 60000
            });
            fs.writeFileSync(tempVideoPath, Buffer.from(videoResponse.data));
          }
        }

        // 检查视频文件是否存在且大小合适
        if (fs.existsSync(tempVideoPath) && fs.statSync(tempVideoPath).size > 1024) {
          console.log('[xx] 视频下载成功，尝试提取封面');

          // 尝试使用ffmpeg提取封面
          try {
            // 使用ffmpeg提取视频的第一帧作为封面
            execSync(`ffmpeg -i "${tempVideoPath}" -ss 00:00:01 -vframes 1 "${tempThumbPath}" -y`, { stdio: 'pipe' });

            // 检查封面是否成功生成
            if (fs.existsSync(tempThumbPath) && fs.statSync(tempThumbPath).size > 0) {
              console.log('[xx] 成功使用ffmpeg提取视频封面');
              const thumbBuffer = fs.readFileSync(tempThumbPath);
              const thumbBase64 = thumbBuffer.toString('base64');

              // 清理临时文件
              try {
                fs.unlinkSync(tempVideoPath);
                fs.unlinkSync(tempThumbPath);
              } catch (cleanupError) {
                console.log('[xx] 清理临时文件失败:', cleanupError.message);
              }

              return thumbBase64;
            }
          } catch (ffmpegError) {
            console.log('[xx] ffmpeg提取封面失败:', ffmpegError.message);

            // 尝试使用其他工具
            try {
              // 尝试使用ImageMagick
              execSync(`convert "${tempVideoPath}[0]" "${tempThumbPath}"`, { stdio: 'pipe' });

              if (fs.existsSync(tempThumbPath) && fs.statSync(tempThumbPath).size > 0) {
                console.log('[xx] 成功使用ImageMagick提取视频封面');
                const thumbBuffer = fs.readFileSync(tempThumbPath);
                const thumbBase64 = thumbBuffer.toString('base64');

                // 清理临时文件
                try {
                  fs.unlinkSync(tempVideoPath);
                  fs.unlinkSync(tempThumbPath);
                } catch (cleanupError) {
                  console.log('[xx] 清理临时文件失败:', cleanupError.message);
                }

                return thumbBase64;
              }
            } catch (imageMagickError) {
              console.log('[xx] ImageMagick提取封面失败:', imageMagickError.message);
            }
          }

          // 如果提取失败，生成一个基于视频内容的封面
          try {
            // 读取视频文件的前几个字节，用于生成唯一的颜色
            const videoHeader = fs.readFileSync(tempVideoPath, { start: 0, end: 1024 });
            const videoHash = crypto.createHash('md5').update(videoHeader).digest('hex');

            // 生成一个彩色的封面图片
            const colorR = parseInt(videoHash.substring(0, 2), 16);
            const colorG = parseInt(videoHash.substring(2, 2), 16);
            const colorB = parseInt(videoHash.substring(4, 2), 16);

            // 获取视频文件大小和修改时间
            const videoStats = fs.statSync(tempVideoPath);
            const videoSize = (videoStats.size / (1024 * 1024)).toFixed(2) + 'MB';
            const videoDate = new Date(videoStats.mtime).toLocaleDateString();

            // 创建一个包含视频信息的SVG图像作为封面
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
              <rect width="120" height="120" fill="rgb(${colorR},${colorG},${colorB})" />
              <circle cx="60" cy="50" r="30" fill="#444" />
              <polygon points="50,35 80,50 50,65" fill="white"/>
              <text x="60" y="95" font-family="Arial" font-size="10" fill="white" text-anchor="middle">${videoSize}</text>
              <text x="60" y="110" font-family="Arial" font-size="8" fill="white" text-anchor="middle">${videoDate}</text>
            </svg>`;

            // 将SVG转换为Base64
            const svgBase64 = Buffer.from(svgContent).toString('base64');
            console.log('[xx] 成功生成基于视频内容的封面图');

            // 清理临时文件
            try {
              fs.unlinkSync(tempVideoPath);
            } catch (cleanupError) {
              console.log('[xx] 清理临时文件失败:', cleanupError.message);
            }

            return svgBase64;
          } catch (svgError) {
            console.log('[xx] 生成SVG封面失败:', svgError.message);
          }
        }
      } catch (e) {
        console.log('[xx] 下载视频或提取封面失败:', e.message);
      }

      // 4. 尝试使用视频元数据API
      try {
        // 对于某些视频托管服务，可以通过其API获取视频信息
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          // YouTube视频
          const videoId = videoUrl.includes('youtu.be/')
            ? videoUrl.split('youtu.be/')[1].split('?')[0]
            : videoUrl.match(/[?&]v=([^&]+)/)[1];

          const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          try {
            const response = await axios.get(thumbUrl, { responseType: 'arraybuffer', timeout: 10000 });
            return Buffer.from(response.data, 'binary').toString('base64');
          } catch (e) {
            console.log('[xx] 获取YouTube视频封面失败:', e.message);
          }
        }
      } catch (e) {
        console.log('[xx] 通过API获取视频封面失败:', e.message);
      }

      // 5. 如果所有方法都失败，生成一个默认的视频封面
      console.log('[xx] 所有封面提取方法都失败，生成默认视频封面');

      // 生成一个简单的视频播放图标SVG
      const defaultSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
        <rect width="120" height="120" fill="black" />
        <circle cx="60" cy="60" r="40" fill="#333" />
        <polygon points="45,40 85,60 45,80" fill="white"/>
        <text x="60" y="105" font-family="Arial" font-size="12" fill="white" text-anchor="middle">视频</text>
      </svg>`;

      // 将SVG转换为Base64
      return Buffer.from(defaultSvgContent).toString('base64');
    } catch (error) {
      console.error('[xx] 获取视频封面时出错:', error.message);
      return null;
    }
  }



  /**
   * 处理视频消息
   * @param {Object} replyInfo 回复信息对象
   * @param {Object} baseParams 基础参数
   * @returns {Promise<Object|null>} 处理后的参数对象
   */
  async function handleVideoMessage(replyInfo, baseParams) {
    console.log('[xx] 开始处理视频消息:', {
      hasPath: !!replyInfo.path,
      hasUrl: !!replyInfo.url,
      hasBase64: !!replyInfo.base64,
      hasThumbPath: !!replyInfo.thumbPath,
      hasThumbUrl: !!replyInfo.thumbUrl,
      hasCoverBase64: !!replyInfo.coverBase64,
      duration: replyInfo.duration
    });

    const fs = require('fs');
    const path = require('path');
    let videoBase64 = '';
    let thumbBase64 = '';

    try {
      // 1. 优先处理本地视频转Base64(带封面)
      if (replyInfo.path && !replyInfo.path.startsWith('http') && replyInfo.thumbPath && !replyInfo.thumbPath.startsWith('http')) {
        console.log('[xx] 处理本地视频和封面');
        try {
          // 检查文件大小限制(100MB)
          const stats = fs.statSync(replyInfo.path);
          if (stats.size > 100 * 1024 * 1024) {
            console.error('[xx] 视频文件超过100MB限制');
            return null;
          }

          // 读取视频文件
          const videoBuffer = fs.readFileSync(replyInfo.path);
          videoBase64 = videoBuffer.toString('base64');

          // 读取封面图
          const thumbBuffer = fs.readFileSync(replyInfo.thumbPath);
          thumbBase64 = thumbBuffer.toString('base64');

          console.log('[xx] 本地视频和封面转换Base64成功');
        } catch (err) {
          console.error('[xx] 本地视频或封面读取失败:', err.message);
          return null;
        }
      }
      // 2. 本地视频转Base64(不带封面)
      else if (replyInfo.path && !replyInfo.path.startsWith('http')) {
        console.log('[xx] 处理本地视频(无封面)');
        try {
          // 检查文件大小限制
          const stats = fs.statSync(replyInfo.path);
          if (stats.size > 100 * 1024 * 1024) {
            console.error('[xx] 视频文件超过100MB限制');
            return null;
          }

          // 读取视频文件
          const videoBuffer = fs.readFileSync(replyInfo.path);
          videoBase64 = videoBuffer.toString('base64');

          // 尝试提取本地视频的封面
          try {
            console.log('[xx] 尝试处理本地视频的封面');

            const videoPath = replyInfo.path;
            const videoDir = path.dirname(videoPath);
            const videoName = path.basename(videoPath, path.extname(videoPath));

            // 1. 首先尝试查找同名的封面图片文件
            console.log('[xx] 尝试查找同名的封面图片文件');

            // 尝试常见的封面图片命名模式
            const possibleThumbPaths = [
              path.join(videoDir, videoName + '.jpg'),
              path.join(videoDir, videoName + '.jpeg'),
              path.join(videoDir, videoName + '.png'),
              path.join(videoDir, videoName + '_thumb.jpg'),
              path.join(videoDir, videoName + '-thumb.jpg'),
              path.join(videoDir, videoName + '_cover.jpg'),
              path.join(videoDir, videoName + '-cover.jpg'),
              path.join(videoDir, 'thumb_' + videoName + '.jpg'),
              path.join(videoDir, 'cover_' + videoName + '.jpg')
            ];

            // 检查是否存在任何一个封面图片
            let thumbFound = false;
            for (const thumbPath of possibleThumbPaths) {
              if (fs.existsSync(thumbPath)) {
                console.log('[xx] 找到本地视频封面:', thumbPath);
                const thumbBuffer = fs.readFileSync(thumbPath);
                thumbBase64 = thumbBuffer.toString('base64');
                thumbFound = true;
                break;
              }
            }

            // 2. 如果没有找到封面图片，尝试使用ffmpeg提取
            if (!thumbFound) {
              console.log('[xx] 未找到封面图片，尝试使用ffmpeg提取');

              try {
                const { execSync } = require('child_process');
                const crypto = require('crypto');
                const os = require('os');

                // 创建临时文件路径
                const videoHash = crypto.createHash('md5').update(videoPath).digest('hex');
                const tempDir = os.tmpdir();
                const tempThumbPath = path.join(tempDir, `thumb_${videoHash}.jpg`);

                // 使用ffmpeg提取视频的第一帧作为封面
                execSync(`ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${tempThumbPath}" -y`, { stdio: 'pipe' });

                // 检查封面是否成功生成
                if (fs.existsSync(tempThumbPath) && fs.statSync(tempThumbPath).size > 0) {
                  console.log('[xx] 成功使用ffmpeg提取视频封面');
                  const thumbBuffer = fs.readFileSync(tempThumbPath);
                  thumbBase64 = thumbBuffer.toString('base64');
                  thumbFound = true;

                  // 清理临时文件
                  try {
                    fs.unlinkSync(tempThumbPath);
                  } catch (cleanupError) {
                    console.log('[xx] 清理临时文件失败:', cleanupError.message);
                  }
                }
              } catch (ffmpegError) {
                console.log('[xx] ffmpeg提取封面失败:', ffmpegError.message);

                // 尝试使用ImageMagick
                try {
                  const tempThumbPath = path.join(os.tmpdir(), `thumb_${crypto.createHash('md5').update(videoPath).digest('hex')}.jpg`);
                  execSync(`convert "${videoPath}[0]" "${tempThumbPath}"`, { stdio: 'pipe' });

                  if (fs.existsSync(tempThumbPath) && fs.statSync(tempThumbPath).size > 0) {
                    console.log('[xx] 成功使用ImageMagick提取视频封面');
                    const thumbBuffer = fs.readFileSync(tempThumbPath);
                    thumbBase64 = thumbBuffer.toString('base64');
                    thumbFound = true;

                    // 清理临时文件
                    try {
                      fs.unlinkSync(tempThumbPath);
                    } catch (cleanupError) {
                      console.log('[xx] 清理临时文件失败:', cleanupError.message);
                    }
                  }
                } catch (imageMagickError) {
                  console.log('[xx] ImageMagick提取封面失败:', imageMagickError.message);
                }
              }
            }

            // 3. 如果仍然没有找到封面，生成一个基于视频内容的封面
            if (!thumbFound) {
              console.log('[xx] 无法提取视频封面，生成基于视频内容的封面');

              try {
                const crypto = require('crypto');

                // 读取视频文件的前几个字节，用于生成唯一的颜色
                const videoHeader = fs.readFileSync(videoPath, { start: 0, end: 1024 });
                const videoHash = crypto.createHash('md5').update(videoHeader).digest('hex');

                // 生成一个彩色的封面图片
                const colorR = parseInt(videoHash.substring(0, 2), 16);
                const colorG = parseInt(videoHash.substring(2, 2), 16);
                const colorB = parseInt(videoHash.substring(4, 2), 16);

                // 获取视频文件大小和修改时间
                const videoStats = fs.statSync(videoPath);
                const videoSize = (videoStats.size / (1024 * 1024)).toFixed(2) + 'MB';
                const videoDate = new Date(videoStats.mtime).toLocaleDateString();

                // 创建一个包含视频信息的SVG图像作为封面
                const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
                  <rect width="120" height="120" fill="rgb(${colorR},${colorG},${colorB})" />
                  <circle cx="60" cy="50" r="30" fill="#444" />
                  <polygon points="50,35 80,50 50,65" fill="white"/>
                  <text x="60" y="95" font-family="Arial" font-size="10" fill="white" text-anchor="middle">${videoSize}</text>
                  <text x="60" y="110" font-family="Arial" font-size="8" fill="white" text-anchor="middle">${videoName}</text>
                </svg>`;

                // 将SVG转换为Base64
                thumbBase64 = Buffer.from(svgContent).toString('base64');
                console.log('[xx] 成功生成基于视频内容的封面图');
              } catch (svgError) {
                console.log('[xx] 生成SVG封面失败:', svgError.message);
                thumbBase64 = generateDefaultThumb();
              }
            }
          } catch (err) {
            console.error('[xx] 处理本地视频封面失败:', err.message);
            thumbBase64 = generateDefaultThumb();
          }

          console.log('[xx] 本地视频转换Base64成功');
        } catch (err) {
          console.error('[xx] 本地视频读取失败:', err.message);
          return null;
        }
      }
      // 3. 在线视频转Base64(带封面)
      else if ((replyInfo.url || (replyInfo.path && replyInfo.path.startsWith('http'))) &&
               (replyInfo.thumbUrl || (replyInfo.thumbPath && replyInfo.thumbPath.startsWith('http')))) {
        const videoUrl = replyInfo.url || replyInfo.path;
        const thumbUrl = replyInfo.thumbUrl || replyInfo.thumbPath;

        console.log('[xx] 处理在线视频和封面:', {
          videoUrl: videoUrl,
          thumbUrl: thumbUrl
        });

        try {
          // 下载视频
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60秒超时
            maxContentLength: 100 * 1024 * 1024 // 100MB限制
          });
          videoBase64 = Buffer.from(videoResponse.data, 'binary').toString('base64');

          // 下载封面
          const thumbResponse = await axios.get(thumbUrl, {
            responseType: 'arraybuffer',
            timeout: 10000 // 10秒超时
          });
          thumbBase64 = Buffer.from(thumbResponse.data, 'binary').toString('base64');

          console.log('[xx] 在线视频和封面下载转换Base64成功');
        } catch (err) {
          console.error('[xx] 在线视频或封面下载失败:', err.message);
          return null;
        }
      }
      // 4. 在线视频转Base64(不带封面)
      else if (replyInfo.url || (replyInfo.path && replyInfo.path.startsWith('http'))) {
        const videoUrl = replyInfo.url || replyInfo.path;
        console.log('[xx] 处理在线视频(无封面):', { videoUrl });

        try {
          // 先尝试获取视频封面
          const thumbnailBase64 = await getVideoThumbnailFromUrl(videoUrl);

          if (thumbnailBase64) {
            // 成功获取到视频封面
            thumbBase64 = thumbnailBase64;
            console.log('[xx] 成功获取视频原始封面');
          } else {
            // 无法获取视频封面，使用默认缩略图
            thumbBase64 = generateDefaultThumb();
            console.log('[xx] 无法获取视频原始封面，使用默认缩略图');
          }

          // 下载视频
          console.log('[xx] 开始下载视频:', videoUrl);
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60秒超时
            maxContentLength: 100 * 1024 * 1024 // 100MB限制
          });
          videoBase64 = Buffer.from(videoResponse.data, 'binary').toString('base64');
          console.log('[xx] 视频下载完成，大小:', Math.round(videoBase64.length / 1024), 'KB');

          console.log('[xx] 在线视频下载转换Base64成功');
        } catch (err) {
          console.error('[xx] 在线视频下载失败:', err.message);
          return null;
        }
      }
      // 直接使用提供的Base64
      else if (replyInfo.base64) {
        console.log('[xx] 使用提供的视频Base64');
        videoBase64 = replyInfo.base64;
        if (replyInfo.coverBase64) {
          thumbBase64 = replyInfo.coverBase64;
        } else {
          // 使用默认缩略图
          thumbBase64 = generateDefaultThumb();
          console.log('[xx] 使用默认缩略图');
        }
      } else {
        console.error('[xx] 无有效的视频来源');
        return null;
      }

      // 确保一定有缩略图
      if (!thumbBase64) {
        // 尝试从视频中提取封面
        try {
          console.log('[xx] 尝试从视频中提取封面');
          // 这里我们无法直接从视频中提取封面，但在实际场景中可以添加相关代码
          // 如果无法提取，使用默认缩略图
          thumbBase64 = generateDefaultThumb();
          console.log('[xx] 无法提取封面，使用默认缩略图作为后备方案');
        } catch (err) {
          console.error('[xx] 提取视频封面失败:', err.message);
          thumbBase64 = generateDefaultThumb();
          console.log('[xx] 使用默认缩略图作为后备方案');
        }
      } else {
        console.log('[xx] 使用提供的视频封面');
      }

      // 构造最终的请求参数
      const params = {
        ...baseParams,
        Base64: videoBase64,
        ImageBase64: thumbBase64, // 使用提取的或提供的封面
        PlayLength: replyInfo.duration || 0
      };

      // 日志记录（不输出完整Base64）
      console.log('[xx] 构造的视频消息参数:', {
        ...params,
        Base64: videoBase64 ? `${videoBase64.substring(0, 20)}...` : '无',
        ImageBase64: thumbBase64 ? `${thumbBase64.substring(0, 20)}...` : '无'
      });

      return params;
    } catch (err) {
      console.error('[xx] 视频处理失败:', err.message);
      return null;
    }
  }

  /**
   * 发送消息到xx平台
   * @param {Object} body 消息体
   * @returns {Promise<any>} 发送结果
   */
  async function sendMsgToXX(body) {
    if (!body) return null;

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // 根据消息类型设置不同的超时时间
        let timeout = 5000; // 默认5秒 (普通请求)

        // 根据xx.md文档中的超时设置
        if (body.api === '/VXAPI/Msg/SendVideo') {
          timeout = 60000; // 视频Base64发送使用60秒超时
        } else if (body.api.includes('Image') || body.api === '/VXAPI/Msg/UploadImg') {
          timeout = 10000; // 图片相关请求使用10秒超时 (图片下载/缩略图下载)
        }

        // 根据消息类型记录不同的日志信息
        const logInfo = {
          api: body.api,
          timeout: `${timeout/1000}秒`,
          ToWxid: body.ToWxid
        };

        // 添加特定类型的日志信息
        if (body.api.includes('Video')) {
          if (body.api === '/VXAPI/Msg/SendVideoByUrl') {
            logInfo.videoUrl = body.Url;
            logInfo.hasThumbUrl = !!body.ThumbUrl;
          } else if (body.api === '/VXAPI/Msg/SendVideoByBase64' || body.api === '/VXAPI/Msg/SendVideo') {
            logInfo.hasBase64 = !!body.Base64;
            logInfo.hasThumbBase64 = !!(body.ThumbBase64 || body.ImageBase64);
            logInfo.base64Length = body.Base64 ? body.Base64.length : 0;
            logInfo.thumbLength = (body.ThumbBase64 || body.ImageBase64) ?
              (body.ThumbBase64 || body.ImageBase64).length : 0;
          }
        } else {
          // 其他类型消息的日志
          logInfo.hasBase64 = !!body.Base64;
          logInfo.hasImageBase64 = !!body.ImageBase64;
          logInfo.contentLength = body.Base64 ? body.Base64.length : 0;
          logInfo.thumbLength = body.ImageBase64 ? body.ImageBase64.length : 0;
        }

        console.log(`[xx] 正在发送消息 (尝试 ${retryCount + 1}/${maxRetries}):`, logInfo);

        // 确保视频消息包含正确的参数格式
        if (body.api === '/VXAPI/Msg/SendVideo') {
          // 添加数据前缀，如果尚未添加
          if (body.Base64 && !body.Base64.startsWith('data:')) {
            body.Base64 = 'data:video/mp4;base64,' + body.Base64;
          }

          // 确保缩略图存在并添加前缀
          if (!body.ImageBase64) {
            // 如果没有缩略图，使用默认缩略图
            body.ImageBase64 = 'data:image/jpeg;base64,' + generateDefaultThumb();
            console.log('[xx] 使用默认缩略图');
          } else if (!body.ImageBase64.startsWith('data:')) {
            // 检查是否是SVG格式
            if (body.ImageBase64.startsWith('<svg') || body.ImageBase64.includes('</svg>')) {
              body.ImageBase64 = 'data:image/svg+xml;base64,' + Buffer.from(body.ImageBase64).toString('base64');
              console.log('[xx] 使用SVG格式缩略图，已转换为Base64');
            } else {
              // 假设是JPEG格式
              body.ImageBase64 = 'data:image/jpeg;base64,' + body.ImageBase64;
              console.log('[xx] 使用提供的缩略图，已添加数据前缀');
            }
          } else {
            console.log('[xx] 使用提供的缩略图（已包含数据前缀）');
          }

          console.log('[xx] 发送视频，参数准备完成');
        }

        // 构造请求参数
        const requestBody = {
          Wxid: body.Wxid,
          ToWxid: body.ToWxid
        };

        // 根据消息类型添加特定参数
        switch (body.api) {
          case '/VXAPI/Msg/SendVideo':
            requestBody.Base64 = body.Base64;
            requestBody.ImageBase64 = body.ImageBase64;
            requestBody.PlayLength = body.PlayLength || 0;
            break;
          case '/VXAPI/Msg/SendTxt':
            requestBody.Content = body.Content;
            requestBody.Type = body.Type || 0;
            requestBody.At = body.At || '';
            break;
          case '/VXAPI/Msg/UploadImg':
            requestBody.Base64 = body.Base64;
            break;
          default:
            // 其他类型消息直接使用body中的参数
            Object.assign(requestBody, body);
            delete requestBody.api;
        }

        // 发送请求
        const result = await axios.post(xxUrl + body.api, requestBody, {
          timeout: timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 Edg/122.0.0.0',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, compress, deflate, br'
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        });

        if (result.data && result.data.Success) {
          console.log(`[xx] ${body.api}发送成功:`, result.data);
          return result.data;
        } else {
          // 视频发送失败，记录错误信息
          console.error(`[xx] 视频发送失败: ${result.data?.Message || '未知错误'}`);

          throw new Error(result.data?.Message || '发送失败');
        }
      } catch (err) {
        retryCount++;
        const isTimeout = err.code === 'ECONNABORTED' || err.message.includes('timeout');
        console.error(`[xx] 发送消息失败 (尝试 ${retryCount}/${maxRetries}):`, {
          api: body.api,
          error: err.message,
          isTimeout: isTimeout,
          statusCode: err.response?.status
        });

        if (retryCount < maxRetries) {
          const delay = retryCount * 2000; // 递增延迟：2秒、4秒、6秒
          console.log(`[xx] ${delay/1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('[xx] 达到最大重试次数，发送失败');
          return null;
        }
      }
    }

    return null;
  }

  // 实现基础功能
  xx.reply = async function(replyInfo) {
    const body = await constructMessage(replyInfo, botId, botgroup);
    if (!body) return;
    return sendMsgToXX(body);
  };

  xx.push = async function(replyInfo) {
    return this.reply(replyInfo);
  };

  // 检测API接口风格
  async function detectApiStyle() {
    try {
      const resPad = await axios.post(xxUrl + '/VXAPI/HeartBeat', {}, {timeout: 2000});
      if (resPad.data && resPad.data.status === 200) {
        console.log('[xx] 检测到PAD风格接口');
        apiPrefix = '/VXAPI';
        return;
      }
    } catch (e) {
      try {
        const resWechatApi = await axios.post(xxUrl + '/api/HeartBeat', {}, {timeout: 2000});
        if (resWechatApi.data && resWechatApi.data.status === 200) {
          console.log('[xx] 检测到WechatAPI风格接口');
          apiPrefix = '/api';
          return;
        }
      } catch (e2) {
        console.log('[xx] 无法自动识别接口风格，使用默认PAD风格');
      }
    }
  }

  await detectApiStyle();

  console.log('[xx] 适配器初始化完成');
  return xx;
};
/* HideEnd */