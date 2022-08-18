const BaseActionConfirmer = require('./BaseActionConfirmer');

const modalHtml = `
<div class="hcd-modal" id="hcdModalContainer">
  <div class="hcd-modal-body" id="hcdModalBody""">
    <div class="hcd-modal-header">
      <h2 class="hcd-modal-title-header">Title</h2>
    </div>
    <div id="hcdModalContent" class="hcd-modal-content">
    </div>
    <div class="hcd-modal-footer">
      <button class="hcd-modal-btn hcd-modal-cancel-btn" type="button">Cancel</button>
      <button class="hcd-modal-btn hcd-modal-confirm-btn" type="button">Confirm</button>
    </div>
  </div>
</div>
${getStyles()}
`;

class ModalActionConfirmer extends BaseActionConfirmer {
    constructor() {
        super();
        this._modal = null;
        this._content = null;
        this._cancelBtn = null;
        this._confirmBtn = null;
    }

    confirm(details, onConfirm, onCancel) {
        this._showModal(
            // `<p>${JSON.stringify(details, null, 4)}</p>`,
            details,
            onConfirm,
            onCancel
        );
    }

    _showModal(content, onConfirm, onCancel) {
        const d = window.document;
        if (!this._modal) {
            const elements = d.getElementsByClassName('hcd-modal');
            if (!elements.length) {
                d.body.insertAdjacentHTML('beforeend', modalHtml);
            }
            this._modal = elements[0];
            this._content = this._getModalElement('hcd-modal-content');
            this._cancelBtn = this._getModalElement('hcd-modal-cancel-btn');
            this._confirmBtn = this._getModalElement('hcd-modal-confirm-btn');
        }
        // this._content.innerHTML = content;
        this._content.innerHTML = this._renderConfirmationDetails(content);
        this._cancelBtn.onclick = () => {
            this._hide();
            onCancel('User cancelled action');
        };
        this._confirmBtn.onclick = () => {
            this._hide();
            onConfirm();
        };
        this._display();
    }

    _getModalElement(className) {
        return this._modal.getElementsByClassName(className)[0];
    }

    _hide() {
        this._modal.style.display = 'none';
    }

    _display() {
        this._modal.style.display = 'block';
    }

    _renderConfirmationDetails(content) {
      const {
        palletName,
        extrinsicName,
        params,
        address,
        payload
      } = content
      const isSigningMessage = !!payload
      const modalTitle = this._getModalElement('hcd-modal-title-header');
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
                    <p class="hcd-label-value">${JSON.stringify(payload, undefined, "\t")}</p>
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
              <p class="hcd-label-name">Pallete:</p>
              <p class="hcd-label-value">${palletName}</p>
          </div>
          <div class="hcd-content-params-container">
              <p class="hcd-label-name">Extrinsic:</p>
              <p class="hcd-label-value">${extrinsicName}</p>
          </div>
          <div class="hcd-content-params-container">
              <p class="hcd-label-name">Params:</p>
              <div class="hcd-content-params-viewer">
                  <p class="hcd-label-value">${JSON.stringify(params, undefined, "\t")}</p>
              </div>
          </div>
      </div>
      `
    }
}

function getStyles() {
    return `
    <styles>
    .mac-modal {
      display: block !important;
      position: fixed;
      z-index: 1;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgb(0, 0, 0);
      background-color: rgba(0, 0, 0, 0.4);
    }
  
    .mac-modal-body {
      background-color: #fefefe;
      margin: 15% auto;
      padding: 20px;
      border: 1px solid #888;
      width: 60%;
      border-radius: 10px;
    }
  
    .mac-modal-content {
      padding: 10px;
      background-color: #f7e8d9; */
      /* background-color: #e95a30; */
      margin-bottom: 20px;
    }
  
    .mac-modal-footer {
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
      /* background-color: #f7e8d9; */
    }
  
    .hcd-content-params-viewer {
      overflow: auto;
      max-height: 150px;
      background-color: rgb(183, 178, 178);
      padding: 10px;
      border-radius: 10px;
    }
    </styles>
  `;
}

module.exports = ModalActionConfirmer;
