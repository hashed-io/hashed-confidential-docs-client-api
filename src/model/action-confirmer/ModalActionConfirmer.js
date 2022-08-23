const BaseActionConfirmer = require('./BaseActionConfirmer')

const modalHtml = `
<div class="hcd-modal" id="hcdModalContainer">
  <div class="hcd-modal-body" id="hcdModalBody""">
    <div class="hcd-modal-header">
      <p class="hcd-modal-title-header">Title</p>
    </div>
    <div id="hcdModalContent" class="hcd-modal-content">
    </div>
    <div class="hcd-modal-footer">
      <button class="hcd-modal-btn hcd-modal-cancel-btn" type="button">Cancel</button>
      <button class="hcd-modal-btn hcd-modal-confirm-btn" type="button">Confirm</button>
    </div>
  </div>
</div>
<style>
  ${getStyles()}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js"></script>
`

class ModalActionConfirmer extends BaseActionConfirmer {
  constructor () {
    super()
    this._modal = null
    this._content = null
    this._cancelBtn = null
    this._confirmBtn = null
  }

  confirm (details, onConfirm, onCancel) {
    this._showModal(
      // `<p>${JSON.stringify(details, null, 4)}</p>`,
      details,
      onConfirm,
      onCancel
    )
  }

  _showModal (content, onConfirm, onCancel) {
    const d = window.document
    window._hcdToggleDocs = this._toggleDocs
    if (!this._modal) {
      const elements = d.getElementsByClassName('hcd-modal')
      if (!elements.length) {
        d.body.insertAdjacentHTML('beforeend', modalHtml)
      }
      this._modal = elements[0]
      this._content = this._getModalElement('hcd-modal-content')
      this._cancelBtn = this._getModalElement('hcd-modal-cancel-btn')
      this._confirmBtn = this._getModalElement('hcd-modal-confirm-btn')
    }
    this._content.innerHTML = this._renderConfirmationDetails(content)
    this._cancelBtn.onclick = () => {
      this._hide()
      onCancel('User cancelled action')
    }
    this._confirmBtn.onclick = () => {
      this._hide()
      onConfirm()
    }
    this._display()
  }

  _getModalElement (className) {
    return this._modal.getElementsByClassName(className)[0]
  }

  _hide () {
    this._modal.style.display = 'none'
  }

  _display () {
    this._modal.style.display = 'block'
  }

  _renderConfirmationDetails (content) {
    const {
      palletName,
      extrinsicName,
      params,
      address,
      payload,
      docs
    } = content
    const isSigningMessage = !!payload
    const modalTitle = this._getModalElement('hcd-modal-title-header')
    const paramsHtml = this._renderParams(params)
    const docsHtml = this._renderDocs(docs)
    console.log('docs', docs, docsHtml)
    console.log('params', params, paramsHtml)
    if (isSigningMessage) {
      modalTitle.innerHTML = 'Sign message'
      return `
          <div>
            <div class="hcd-content-params-container">
                <p class="hcd-label-name">Address:</p>
                <p class="hcd-label-value">${address}</p>
            </div>
            <div class="hcd-content-params-container">
                <p class="hcd-label-name">Payload:</p>
                <div class="hcd-content-params-viewer">
                    ${paramsHtml}
                </div>
            </div>
        </div>
        `
    }
    modalTitle.innerHTML = 'Confirm action'
    return `
      <div>
          <div class="hcd-content-params-container">
              <p class="hcd-label-name">Address:</p>
              <p class="hcd-label-value">${address}</p>
          </div>
          <div class="hcd-content-params-container">
              <p class="hcd-label-name">Pallet:</p>
              <p class="hcd-label-value">${palletName}</p>
          </div>
          <div class="hcd-content-params-container">
              <p class="hcd-label-name">Extrinsic:</p>
              <p class="hcd-label-value">${extrinsicName}</p>
          </div>
          <div class="hcd-content-params-container">
              <p class="hcd-label-name">Params:</p>
              <div class="hcd-content-params-viewer">
                  ${paramsHtml}
              </div>
          </div>
          <div class="hcd-content-params-container">
              <p class="hcd-label-toggle" onclick="_hcdToggleDocs()">See Docs</p>
              <div class="hcd-content-docs-viewer">
                  ${docsHtml}
              </div>
          </div>
      </div>
      `
  }

  _renderParams(params) {
    if(params.length <= 0) return ''
    let html = ''
    params.forEach(param => {
      html += `<p class="hcd-label-name" style="text-decoration: underline !important; color: black !important">${param.name}</p>
        <p class="hcd-label-value" style="margin-bottom: 10px !important">${JSON.stringify(param.value)}</p>`
    });
    return html
  }

  _renderDocs(docs) {
    const converter = new showdown.Converter();
    if(docs.length <= 0) return ''
    let html = ''
    docs.forEach(async doc => {
      html += converter.makeHtml(doc)
    });
    return html
  }

  _toggleDocs() {
    const docsContainer = window.document.getElementsByClassName('hcd-content-docs-viewer')[0]
    const toggleLabel = window.document.getElementsByClassName('hcd-label-toggle')[0]
    const currentState = docsContainer.style.display
    if (currentState === 'block') {
      docsContainer.style.display = 'none'
      toggleLabel.innerHTML = 'See Docs'
    } else {
      docsContainer.style.display = 'block'
      toggleLabel.innerHTML = 'Hide Docs'
    }
  }
}

function getStyles () {
  return `
    .hcd-modal {
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100vh;
      overflow: auto;
      background-color: rgb(0, 0, 0);
      background-color: rgba(0, 0, 0, 0.4);
    }
  
    .hcd-modal-body {
      position: absolute;
      background-color: #fefefe;
      margin: auto;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px;
      border: 1px solid #888;
      width: 60%;
      height: fit-content;
      border-radius: 10px;
    }
  
    .hcd-modal-content {
      padding: 10px;
      background-color: #f7e8d9;
      margin-bottom: 20px;
    }

    .hcd-modal-footer {
      display: flex;
      padding-left: 5%;
      padding-right: 5%;
    }

    .hcd-modal-cancel-btn {
      background-color: red;
      padding: 15px;
      color: white;
      border: none;
      border-radius: 10px;
      flex: 1;
      margin: 10px;
      margin-right: 2%;
      margin-left: 5%;
    }

    .hcd-modal-confirm-btn {
      background-color: green;
      padding: 15px;
      color: white;
      border: none;
      border-radius: 10px;
      flex: 1;
      margin: 10px;
      margin-right: 5%;
      margin-left: 2%;
    }

    .hcd-modal-btn:hover {
      opacity: 0.8;
      cursor: pointer;
    }

    .hcd-label-name {
      font-size: 16px;
      margin: 0px !important;
      margin: none !important;
      font-weight: bold;
      color: #888;
    }

    .hcd-label-value {
      font-size: 18px;
      margin: 0px !important;
    }

    .hcd-content-params-container {
      margin-bottom: 10px;
      max-width: 100%;
      overflow: auto;
      /* background-color: #f7e8d9; */
    }

    .hcd-content-params-viewer {
      overflow: auto;
      max-height: 150px;
      background-color: rgb(183, 178, 178);
      padding: 10px;
      border-radius: 10px;
    }
    
    .hcd-content-docs-viewer {
      display: none;
      overflow: auto;
      max-height: 150px;
      background-color: rgb(183, 178, 178);
      padding: 10px;
      border-radius: 10px;
    }

    .hcd-modal-title-header {
      font-size: 24px;
      font-weight: bold;
    }

    .hcd-label-toggle {
      font-size: 16px;
      margin: 0px !important;
      margin: none !important;
      font-weight: bold;
      color: #888;
      text-decoration: underline;
      cursor: pointer;
    }

    @media only screen and (max-width: 700px) {
      .hcd-modal-body {
        width: 90%
      }
    }
  
    @media only screen and (min-width: 1200px) {
      .hcd-modal-body {
        width: 40%
      }
    }
  `
}

module.exports = ModalActionConfirmer
