<template>
  <div style="height:100%;">
    <el-container style="height:100%;">
      <el-header>剪切板图片转成 base64 编码</el-header>
      <el-main>
        <div class="converter-input">
          <el-input
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 5}"
            placeholder="请粘贴内容"
            v-on:paste.native="paste"
          >
          </el-input>
          <el-input
            placeholder="图片描述文字（可选）"
            v-model="markdownImgSate"
            style="margin-top:4%;"
          >
            <template slot="prepend">Alt text</template>
          </el-input>
        </div>
        <div class="converter-prompt">所粘贴图片：</div>
        <div
          class="size-slider"
          v-show="pasteImageData!==''"
        >
          <div class="scale-value">
            <span>缩放比例：{{zoomScale}}%</span>
          </div>
          <el-slider
            :min="0"
            :max="200"
            v-model="zoomScale"
          ></el-slider>
        </div>
        <div
          class="size-slider"
          v-show="pasteImageData!==''"
        >
          <div class="scale-value">
            <span>图片质量：{{imageQuality}}</span>
          </div>
          <el-slider
            :min="0"
            :max="1"
            :step="0.1"
            v-model="imageQuality"
            @change="qualityChange"
          ></el-slider>
        </div>
        <img
          class="converter-img"
          :style="{zoom:zoomScale/100}"
          :src="pasteImageData"
        />
        <div class="converter-button">
          <el-button
            type="young"
            @click="copy2markdown"
          >一键复制 (markdown）</el-button>
          <el-button
            type="young"
            v-clipboard:copy="imgElementData"
            style="margin-left:6%;"
            v-clipboard:success="onCopy"
            v-clipboard:error="onError"
          >一键复制 (&lt;img&gt;)</el-button>
        </div>
        <div class="tip">
          <!-- Typora 允许使用 &lt;img&gt; 标签来显示并调整图片大小。 -->
          Typora allows to use &lt;img&gt; tag for displaying images, such it can also be used to adjust the size of images.
          <br> For example, you could specify the width or height attribute of an &lt;img&gt; tag, or set the width/height in
          its style attribute.
          <br> Another common user case is that when you try to insert a retina image, and want to scale it to a “correct” size
          according, then you could specify a zoom factor in its style attribute.
        </div>
      </el-main>
    </el-container>

  </div>
</template>

<script>
export default {
  data() {
    return {
      pasteImageData: "",
      base64Data: "",
      markdownImgSate: "",
      zoomScale: 100,
      imageQuality: 1,
      originalBase64: "",
    };
  },
  computed: {
    // 为 markdown 语法准备的字符串
    markdownData() {
      if (!this.base64Data) {
        return "";
      }
      return "![" + this.markdownImgSate + "](" + this.base64Data + ")";
    },
    // 为 img 标签准备的字符串
    imgElementData() {
      return (
        "<img src='" +
        this.base64Data +
        "' alt='" +
        this.markdownImgSate +
        "' style='zoom:" +
        this.zoomScale / 100 +
        ";'>"
      );
    },
  },
  mounted() {},
  methods: {
    // 压缩图片的 base64 长度
    compressBase64Length(base64, callback) {
      let image = new Image(),
        MAX_HEIGHT = 1000;
      // 回调函数赋值给 onload
      image.onload = () => {
        let canvas = "";
        canvas = document.createElement("canvas");
        // document.getElementById("canvasContent").appendChild(canvas)
        if (image.height > MAX_HEIGHT) {
          image.width *= MAX_HEIGHT / image.height;
          image.height = MAX_HEIGHT;
        }
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, image.width, image.height);
        // 调用 canvas 的 api，第二个参数是图片质量
        let newBase64 = canvas.toDataURL("image/jpeg", this.imageQuality);
        callback(newBase64);
      };
      // 图片加载完后调用 onload 回调
      image.src = base64;
    },
    // 改变滑块的值
    qualityChange(qualityParam) {
      this.compressBase64Length(this.originalBase64, (newBase64) => {
        this.pasteImageData = newBase64;
        this.base64Data = newBase64;
      });
    },
    // paste 事件
    paste(e) {
      this.markdownImgSate = "";
      let isImage = true;
      if (!(e.clipboardData && e.clipboardData.items)) {
        return;
      }
      for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
        let item = e.clipboardData.items[i];
        if (item.kind === "file") {
          // pasteFile就是获取到的文件 (blob 对象)
          let pasteFile = item.getAsFile();
          if (pasteFile.size > 0 && pasteFile.type.match("^image/")) {
            // console.log("图片");
            this.blobToBase64(pasteFile, (data) => {
              this.originalBase64 = data;
              // 压缩图片的 base64 长度
              this.compressBase64Length(this.originalBase64, (newBase64) => {
                this.pasteImageData = newBase64;
                this.base64Data = newBase64;
              });
            });
          }
        } else {
          console.log("粘贴的不是文件");
          isImage = false;
          break;
        }
      }
      if (!isImage) {
        this.$notify.error({
          title: "错误",
          message: "只能粘贴图片文件！",
        });
      }
    },
    // blob 对象转为 base64 编码
    blobToBase64(blob, callback) {
      let reader = new FileReader();
      reader.onload = function (e) {
        callback(e.target.result);
      };
      reader.readAsDataURL(blob);
    },
    getBase64(url) {
      let self = this;
      let Img = new Image(),
        dataURL = "";
      Img.src = url;
      let p = new Promise(function (resolve, reject) {
        Img.onload = function () {
          //要先确保图片完整获取到，这是个异步事件
          let canvas = document.createElement("canvas"), //创建canvas元素
            width = Img.width, //确保canvas的尺寸和图片一样
            height = Img.height;
          // 默认将长宽设置为图片的原始长宽，这样在长宽不超过最大长度时就不需要再处理
          let ratio = width / height,
            maxLength = 1000,
            newHeight = height,
            newWidth = width;
          // 在长宽超过最大长度时，按图片长宽比例等比缩小
          if (width > maxLength || height > maxLength) {
            if (width > height) {
              newWidth = maxLength;
              newHeight = maxLength / ratio;
            } else {
              newWidth = maxLength * ratio;
              newHeight = maxLength;
            }
          }
          canvas.width = newWidth;
          canvas.height = newHeight;
          canvas.getContext("2d").drawImage(Img, 0, 0, newWidth, newHeight); //将图片绘制到canvas中
          dataURL = canvas.toDataURL("image/jpeg", 0.5); //转换图片为dataURL
          resolve(dataURL);
        };
      });
      return p;
    },
    // 复制成功
    onCopy() {
      this.$message({
        message: "复制成功",
        type: "success",
      });
    },
    // 复制失败
    onError(content) {
      this.$message.error(content || "复制失败");
    },
    copy2markdown() {
      let _this = this;
      if (!this.markdownData) {
        _this.onError("复制失败,读取内容为空！");
        return;
      }
      this.$copyText(this.markdownData).then(
        function (e) {
          _this.onCopy();
          console.log(e);
        },
        function (e) {
          _this.onError();
          console.log(e);
        }
      );
    },
  },
};
</script>
<style>
.el-slider__bar {
  background-color: #95e1d3 !important;
}
.el-slider__button {
  border: 2px solid #95e1d3 !important;
}
</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.el-header,
.el-footer {
  background-color: #ff75a0;
  color: #ffff;
  text-align: center;
  line-height: 60px;
}
.el-aside {
  background-color: #d3dce6;
  color: #333;
  text-align: center;
  line-height: 200px;
}
.el-main {
  background-color: #f9f9f9;
  color: #333;
  text-align: center;
  height: 100%;
  /* line-height: 160px; */
}
body > .el-container {
  margin-bottom: 40px;
}
.el-container:nth-child(5) .el-aside,
.el-container:nth-child(6) .el-aside {
  line-height: 260px;
}
.el-container:nth-child(7) .el-aside {
  line-height: 320px;
}
.converter-input {
  display: inline-block;
  width: 60%;
}
.converter-prompt {
  display: inline-block;
  width: 60%;
  text-align: left;
  margin-top: 4%;
  color: #95e1d3;
}
.converter-img {
  display: block;
  margin: 2% auto 0 auto;
  box-shadow: 1px 3px 8px grey;
}
.converter-button {
  margin-top: 4%;
}
.size-slider {
  width: 60%;
  margin: 1% auto 0 auto;
}
.size-slider span {
  color: #95e1d3;
}
.scale-value {
  display: flex;
}
.tip {
  width: 60%;
  margin: 2% auto 0 auto;
  padding: 8px 16px;
  background-color: #f3f0f0;
  border-radius: 4px;
  border-left: 5px solid #909399;
  text-align: left;
  color: #77787b;
}

.el-button--young.is-active,
.el-button--young:active {
  background: #20b2aa;
  border-color: #20b2aa;
  color: #fff;
}

.el-button--young:focus,
.el-button--young:hover {
  background: #48d1cc;
  border-color: #48d1cc;
  color: #fff;
}

.el-button--young {
  color: #fff;
  background-color: #20b2aa;
  border-color: #20b2aa;
}
</style>

