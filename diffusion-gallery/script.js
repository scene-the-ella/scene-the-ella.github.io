// 갤러리 데이터
// GitHub Pages 배포 시: https://scene-the-ella.github.io/diffusion-gallery/
// 모든 파일(svg_input, output_videos)을 같은 폴더에 배치하거나
// 상대 경로를 사용하여 같은 저장소 내의 파일을 참조하세요
const galleryData = [
    {
        id: 1,
        inputImage: 'svg_input/volcano.svg',
        title: 'Volcano',
        prompt: 'A volcano is erupting, and lava is flowing out.',
        description: '화산 이미지를 입력으로 사용한 애니메이션 생성 결과입니다.',
        videos: [
            {
                src: 'output_videos/volcano.gif',
                thumbnail: 'output_videos/volcano.gif'
            },
            {
                src: 'output_videos/volcano.mp4',
                thumbnail: 'output_videos/volcano.gif'
            }
        ]
    },
    {
        id: 2,
        inputImage: 'svg_input/hamburger.svg',
        title: 'Hamburger',
        prompt: 'A hamburger shaking wildly from multiple angles.',
        description: '햄버거 이미지를 입력으로 사용한 애니메이션 생성 결과입니다.',
        videos: [
            {
                src: 'output_videos/hamburger.gif',
                thumbnail: 'output_videos/hamburger.gif'
            },
            {
                src: 'output_videos/hamburger.mp4',
                thumbnail: 'output_videos/hamburger.gif'
            }
        ]
    }
];

// 갤러리 렌더링
function renderGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!galleryGrid) return;

    galleryGrid.innerHTML = galleryData.map(item => `
        <div class="gallery-item">
            <div class="gallery-header">
                <h3>${item.title}</h3>
            </div>
            <div class="process-flow">
                <div class="input-section">
                    <div class="step-label">Input</div>
                    <div class="input-image-container">
                        <img src="${item.inputImage}" alt="${item.title}" loading="lazy">
                    </div>
                    <p class="step-description">Static SVG image</p>
                </div>
                
                <div class="process-arrow">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 30 L40 30 M35 25 L40 30 L35 35" stroke="rgba(102, 126, 234, 0.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="arrow-label">Animate</span>
                    ${item.prompt ? `<p class="prompt-text">${item.prompt}</p>` : ''}
                </div>
                
                <div class="output-section">
                    <div class="step-label">Output</div>
                    <div class="videos-grid">
                        ${item.videos
                            .filter(video => video.src.endsWith('.gif'))
                            .map((video, index) => {
                                // GIF는 캐시 방지를 위해 타임스탬프 추가 (한 번만)
                                const gifSrc = video.src;
                                return `
                                <div class="video-item gif-item" data-video-src="${video.src}" data-item-id="${item.id}" data-video-index="${index}">
                                    <img src="${gifSrc}" alt="${item.title} animation ${index + 1}" loading="lazy" class="gif-image">
                                </div>
                            `;
                            }).join('')}
                    </div>
                    <p class="step-description">Animated GIF result</p>
                </div>
            </div>
        </div>
    `).join('');

    // 비디오 호버 이벤트 추가
    setupVideoInteractions();
    
    // GIF 이미지가 제대로 로드되었는지 확인 (깜빡임 방지)
    const gifImages = document.querySelectorAll('.gif-image');
    gifImages.forEach(img => {
        // 이미 로드된 경우
        if (img.complete && img.naturalWidth > 0) {
            // GIF가 정상적으로 로드되었음
            return;
        }
        // 로드 에러 처리
        img.addEventListener('error', () => {
            console.warn('GIF 이미지 로드 실패:', img.src);
        });
    });
}

// 비디오 인터랙션 설정 (GIF만 처리)
function setupVideoInteractions() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        const img = item.querySelector('img');
        const videoSrc = item.getAttribute('data-video-src');
        
        // GIF 이미지 클릭 시 모달로 확대
        if (img) {
            item.addEventListener('click', () => {
                showVideoModal(videoSrc, 'gif');
            });
        }
    });
}

// 비디오 모달 표시
function showVideoModal(mediaSrc, type = 'video') {
    // 모달이 없으면 생성
    let modal = document.getElementById('videoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'videoModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        
        // 닫기 버튼 이벤트
        const closeModal = () => {
            const modalVideo = modal.querySelector('video');
            if (modalVideo) {
                modalVideo.pause();
            }
            modal.classList.remove('active');
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', closeModal);
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    // 모달 내용 업데이트
    if (type === 'gif') {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${mediaSrc}" alt="Animation" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <video controls autoplay>
                    <source src="${mediaSrc}" type="video/mp4">
                    브라우저가 비디오 태그를 지원하지 않습니다.
                </video>
            </div>
        `;
    }
    
    // 닫기 버튼 이벤트 다시 연결
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        const modalVideo = modal.querySelector('video');
        if (modalVideo) {
            modalVideo.pause();
        }
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

// 페이지 로드 시 갤러리 렌더링
document.addEventListener('DOMContentLoaded', () => {
    renderGallery();
});

// 이미지 로드 에러 처리
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://via.placeholder.com/400x400/667eea/ffffff?text=Image+Not+Found';
    }
}, true);
